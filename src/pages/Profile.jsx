import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Settings, TrendingUp, Award, Calendar, Dumbbell, Target, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Profile() {
  const [selectedMember, setSelectedMember] = useState(null);

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-created_date')
  });

  const currentMember = selectedMember || members[0];
  const memberLifts = lifts.filter(l => l.member_id === currentMember?.id);

  const stats = {
    totalLifts: memberLifts.length,
    personalRecords: memberLifts.filter(l => l.is_pr).length,
    totalWeight: memberLifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0),
    bestLift: Math.max(...memberLifts.map(l => l.weight_lbs), 0),
    weekStreak: 5
  };

  const getProgressData = () => {
    const last30Days = memberLifts
      .filter(l => l.exercise === 'bench_press')
      .slice(0, 10)
      .reverse()
      .map((l, i) => ({
        session: `S${i + 1}`,
        weight: l.weight_lbs
      }));
    return last30Days;
  };

  if (!currentMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No member data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 px-4 pt-8 pb-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg">
              {currentMember.avatar_url ? (
                <img src={currentMember.avatar_url} alt={currentMember.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-purple-500">
                  {currentMember.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-black">{currentMember.name}</h1>
              <p className="text-purple-100">{currentMember.nickname}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-4 -mt-12 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white border-2 border-gray-100 p-4 text-center shadow-md">
            <div className="text-2xl font-black text-gray-900">{stats.totalLifts}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Workouts</div>
          </Card>
          <Card className="bg-white border-2 border-gray-100 p-4 text-center shadow-md">
            <div className="text-2xl font-black text-orange-500">{stats.personalRecords}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">PRs</div>
          </Card>
          <Card className="bg-white border-2 border-gray-100 p-4 text-center shadow-md">
            <div className="text-2xl font-black text-purple-500">{stats.weekStreak}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">Day Streak</div>
          </Card>
        </div>

        {/* Share Weekly Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Weekly Summary</h3>
              <p className="text-sm text-gray-600">
                {stats.totalLifts} workouts • {stats.personalRecords} PRs • {stats.weekStreak} day streak
              </p>
            </div>
            <Button 
              onClick={() => {
                const summary = `💪 My Week in Fitness:\n✅ ${stats.totalLifts} workouts completed\n🔥 ${stats.personalRecords} personal records\n⚡ ${stats.weekStreak} day streak\n🏋️ ${stats.totalWeight.toLocaleString()} lbs total lifted`;
                navigator.clipboard.writeText(summary);
                alert('Weekly summary copied to clipboard!');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="progress" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Progress
            </TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl font-semibold data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card className="bg-white border-2 border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Bench Press Progress
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={getProgressData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="session" stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#A855F7" strokeWidth={3} dot={{ fill: '#A855F7', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-white border-2 border-gray-100 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Current Goals
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">Squat 400 lbs</span>
                    <span className="text-gray-500">75%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: '75%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">50 Workouts This Month</span>
                    <span className="text-gray-500">60%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {[
              { icon: Award, title: '100 Workouts', desc: 'Completed 100 training sessions', color: 'from-yellow-400 to-orange-500', unlocked: true },
              { icon: TrendingUp, title: 'PR Crusher', desc: 'Set 10 personal records', color: 'from-red-400 to-pink-500', unlocked: true },
              { icon: Dumbbell, title: 'Iron Warrior', desc: 'Lift 100,000 lbs total', color: 'from-purple-400 to-purple-600', unlocked: false },
              { icon: Calendar, title: '30 Day Streak', desc: 'Train for 30 consecutive days', color: 'from-blue-400 to-cyan-500', unlocked: false }
            ].map((achievement, idx) => (
              <Card key={idx} className={`bg-white border-2 border-gray-100 p-5 ${achievement.unlocked ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center shadow-md`}>
                    <achievement.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{achievement.title}</h4>
                    <p className="text-sm text-gray-500">{achievement.desc}</p>
                  </div>
                  {achievement.unlocked && (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {memberLifts.slice(0, 10).map((lift) => (
              <Card key={lift.id} className="bg-white border-2 border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 capitalize">{lift.exercise?.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-gray-500">{new Date(lift.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xl font-black text-gray-900">{lift.weight_lbs}</div>
                      <div className="text-xs text-gray-500">lbs {lift.reps && `× ${lift.reps}`}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        const summary = `💪 Just completed ${lift.exercise.replace(/_/g, ' ')} - ${lift.weight_lbs} lbs${lift.reps ? ` × ${lift.reps} reps` : ''}! ${lift.is_pr ? '🔥 NEW PR!' : ''}`;
                        navigator.clipboard.writeText(summary);
                        alert('Workout summary copied! Share it with your friends.');
                      }}
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}