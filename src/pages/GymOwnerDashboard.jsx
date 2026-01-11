import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Trophy, Calendar, Star, Target, Award, Activity, Bell, Settings, Plus, Edit, Image as ImageIcon, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function GymOwnerDashboard() {
  const [selectedGym, setSelectedGym] = useState(null);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState('overall');
  const queryClient = useQueryClient();

  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Auto-refetch on mount to get latest user data
  React.useEffect(() => {
    refetchUser();
  }, []);

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list(),
    enabled: !!currentUser
  });

  const myGyms = gyms.filter(g => g.owner_email === currentUser?.email);

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: () => base44.entities.CheckIn.list(),
    enabled: !!currentUser
  });

  const { data: allMemberships = [] } = useQuery({
    queryKey: ['allMemberships'],
    queryFn: () => base44.entities.GymMembership.list(),
    enabled: !!currentUser
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser
  });

  React.useEffect(() => {
    if (myGyms.length > 0 && !selectedGym) {
      setSelectedGym(myGyms[0]);
    }
  }, [myGyms, selectedGym]);

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', selectedGym?.id],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }),
    enabled: !!selectedGym
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts', selectedGym?.id],
    queryFn: async () => {
      const allLifts = await base44.entities.Lift.list();
      return allLifts.filter(l => l.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', selectedGym?.id],
    queryFn: async () => {
      const allRewards = await base44.entities.Reward.list();
      return allRewards.filter(r => r.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', selectedGym?.id],
    queryFn: async () => {
      const allClasses = await base44.entities.GymClass.list();
      return allClasses.filter(c => c.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches', selectedGym?.id],
    queryFn: async () => {
      const allCoaches = await base44.entities.Coach.list();
      return allCoaches.filter(c => c.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', selectedGym?.id],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list();
      return allEvents.filter(e => e.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym
  });

  const createRewardMutation = useMutation({
    mutationFn: (rewardData) => base44.entities.Reward.create(rewardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedGym?.id] });
    }
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (rewardId) => base44.entities.Reward.delete(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', selectedGym?.id] });
    }
  });

  const createClassMutation = useMutation({
    mutationFn: (classData) => base44.entities.GymClass.create(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', selectedGym?.id] });
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (classId) => base44.entities.GymClass.delete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', selectedGym?.id] });
    }
  });

  const createCoachMutation = useMutation({
    mutationFn: (coachData) => base44.entities.Coach.create(coachData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] });
    }
  });

  const deleteCoachMutation = useMutation({
    mutationFn: (coachId) => base44.entities.Coach.delete(coachId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] });
    }
  });

  const updateGalleryMutation = useMutation({
    mutationFn: (gallery) => base44.entities.Gym.update(selectedGym.id, { gallery }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setShowManagePhotos(false);
    }
  });

  const banMemberMutation = useMutation({
    mutationFn: (userId) => {
      const currentBanned = selectedGym?.banned_members || [];
      return base44.entities.Gym.update(selectedGym.id, { 
        banned_members: [...currentBanned, userId] 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
    }
  });

  const unbanMemberMutation = useMutation({
    mutationFn: (userId) => {
      const currentBanned = selectedGym?.banned_members || [];
      return base44.entities.Gym.update(selectedGym.id, { 
        banned_members: currentBanned.filter(id => id !== userId) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
    }
  });

  // Access check temporarily disabled for testing
  // if (currentUser?.account_type !== 'gym_owner') {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //       <Card className="p-8 text-center max-w-md">
  //         <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
  //         <h2 className="text-2xl font-bold text-gray-900 mb-2">Gym Owner Access Only</h2>
  //         <p className="text-gray-600 mb-4">This dashboard is only accessible to gym owners</p>
  //         <Link to={createPageUrl('Home')}>
  //           <Button>Back to Home</Button>
  //         </Link>
  //       </Card>
  //     </div>
  //   );
  // }

  if (myGyms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Gyms Registered</h2>
          <p className="text-gray-600 mb-4">You haven't registered any gyms yet</p>
          <Link to={createPageUrl('GymSignup')}>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
              Register Your Gym
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const uniqueMembers = new Set(checkIns.map(c => c.user_id)).size;
  const last7Days = checkIns.filter(c => {
    const checkInDate = new Date(c.check_in_date);
    return isWithinInterval(checkInDate, { start: subDays(new Date(), 7), end: new Date() });
  }).length;

  const last30Days = checkIns.filter(c => {
    const checkInDate = new Date(c.check_in_date);
    return isWithinInterval(checkInDate, { start: subDays(new Date(), 30), end: new Date() });
  }).length;

  // Calculate at-risk members (no check-in for 7-10 days)
  const gymMemberships = allMemberships.filter(m => m.gym_id === selectedGym?.id && m.status === 'active');
  const atRiskMembers = gymMemberships.filter(membership => {
    const memberCheckIns = checkIns.filter(c => c.user_id === membership.user_id);
    if (memberCheckIns.length === 0) return false;
    
    const lastCheckIn = new Date(memberCheckIns[0].check_in_date);
    const daysSinceLastCheckIn = Math.floor((new Date() - lastCheckIn) / (1000 * 60 * 60 * 24));
    
    return daysSinceLastCheckIn >= 7 && daysSinceLastCheckIn <= 10;
  }).length;

  // Check-ins by day (last 7 days)
  const checkInsByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayCheckIns = checkIns.filter(c => {
      const checkInDate = startOfDay(new Date(c.check_in_date));
      return checkInDate.getTime() === startOfDay(date).getTime();
    });
    checkInsByDay.push({
      day: format(date, 'EEE'),
      checkIns: dayCheckIns.length
    });
  }

  // Exercise breakdown
  const exerciseBreakdown = lifts.reduce((acc, lift) => {
    const exercise = lift.exercise?.replace(/_/g, ' ') || 'Other';
    acc[exercise] = (acc[exercise] || 0) + 1;
    return acc;
  }, {});

  const exerciseData = Object.entries(exerciseBreakdown).map(([name, value]) => ({
    name,
    value
  }));

  // Gym Leaderboard Data
  const gymLeaderboardData = gyms.map(gym => {
    const gymCheckIns = allCheckIns.filter(c => c.gym_id === gym.id);
    const gymMembers = allMemberships.filter(m => m.gym_id === gym.id && m.status === 'active');
    const uniqueUsers = new Set(gymCheckIns.map(c => c.user_id)).size;
    
    // Calculate engagement score
    const avgCheckInsPerMember = uniqueUsers > 0 ? gymCheckIns.length / uniqueUsers : 0;
    const engagementScore = Math.min(100, Math.round((avgCheckInsPerMember / 10) * 100));
    
    return {
      id: gym.id,
      name: gym.name,
      members: gymMembers.length,
      rating: gym.rating || 0,
      checkIns: gymCheckIns.length,
      engagementScore,
      isOwner: gym.owner_email === currentUser?.email,
      overallScore: (gymMembers.length * 0.4 + (gym.rating || 0) * 20 * 0.4 + engagementScore * 0.2)
    };
  });

  // Sort based on filter
  const sortedGyms = [...gymLeaderboardData].sort((a, b) => {
    switch (leaderboardFilter) {
      case 'members':
        return b.members - a.members;
      case 'rating':
        return b.rating - a.rating;
      case 'engagement':
        return b.engagementScore - a.engagementScore;
      case 'overall':
      default:
        return b.overallScore - a.overallScore;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Gym Owner Dashboard</h1>
            <p className="text-gray-600">Manage your gym and track performance</p>
          </div>
          
          <div className="flex gap-3 items-center">
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="border-2">
                <Users className="w-4 h-4 mr-2" />
                Member View
              </Button>
            </Link>
            
            {myGyms.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {myGyms.map(gym => (
                  <Button
                    key={gym.id}
                    variant={selectedGym?.id === gym.id ? 'default' : 'outline'}
                    onClick={() => setSelectedGym(gym)}
                    className="whitespace-nowrap"
                  >
                    {gym.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* At-Risk Alert */}
        {atRiskMembers > 0 && (
          <Card className="p-5 mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg mb-1">⚠️ Members At Risk</h3>
                <p className="text-white/90 text-sm">
                  {atRiskMembers} {atRiskMembers === 1 ? 'member hasn\'t' : 'members haven\'t'} checked in for 7-10 days this week
                </p>
              </div>
              <Button
                onClick={() => setShowManageMembers(true)}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 border-white/50 text-white font-bold"
              >
                View Members
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black mb-1">{uniqueMembers}</div>
            <p className="text-blue-100">Active Members</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8" />
              <Badge className="bg-white/20 text-white">{last7Days} this week</Badge>
            </div>
            <div className="text-3xl font-black mb-1">{last30Days}</div>
            <p className="text-green-100">Check-ins (30 days)</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8" />
              <Star className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black mb-1">{lifts.length}</div>
            <p className="text-orange-100">Total PRs Logged</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8" />
              <span className="text-2xl font-bold">{selectedGym?.rating || 0}/5</span>
            </div>
            <div className="text-3xl font-black mb-1">{selectedGym?.rating || 0}</div>
            <p className="text-purple-100">Average Rating</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id} className="col-span-2 md:col-span-1">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white h-auto py-6 flex-col gap-2 shadow-lg">
              <Dumbbell className="w-8 h-8" />
              <span className="font-black text-lg">View My Gym</span>
              <span className="text-xs text-blue-100">Manage & Post</span>
            </Button>
          </Link>
          <Button
            onClick={() => setShowManageMembers(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 h-auto py-4 flex-col gap-2"
          >
            <Users className="w-6 h-6" />
            <span className="font-bold">Members</span>
          </Button>
          <Button
            onClick={() => setShowManageRewards(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 h-auto py-4 flex-col gap-2"
          >
            <Award className="w-6 h-6" />
            <span className="font-bold">Rewards</span>
          </Button>
          <Button
            onClick={() => setShowManageClasses(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 h-auto py-4 flex-col gap-2"
          >
            <Calendar className="w-6 h-6" />
            <span className="font-bold">Classes</span>
          </Button>
          <Button
            onClick={() => setShowManageCoaches(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 h-auto py-4 flex-col gap-2"
          >
            <Target className="w-6 h-6" />
            <span className="font-bold">Coaches</span>
          </Button>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="analytics" className="rounded-xl font-semibold">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-xl font-semibold">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="management" className="rounded-xl font-semibold">
              Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl font-semibold">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Check-ins Chart */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Check-ins (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={checkInsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="checkIns" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Exercise Breakdown */}
            {exerciseData.length > 0 && (
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Exercises</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={exerciseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {exerciseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Top Members */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Most Active Members</h3>
              {checkIns.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(
                    checkIns.reduce((acc, c) => {
                      acc[c.user_name] = (acc[c.user_name] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count], idx) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-white">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-gray-900">{name}</span>
                        </div>
                        <Badge>{count} check-ins</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No check-ins yet</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Gym Leaderboard</h3>
              <p className="text-gray-600 mb-4">See how your gym ranks against others in the community</p>
              
              {/* Filters */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                <Button
                  variant={leaderboardFilter === 'overall' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardFilter('overall')}
                  className="rounded-2xl whitespace-nowrap"
                  size="sm"
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Overall Best
                </Button>
                <Button
                  variant={leaderboardFilter === 'members' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardFilter('members')}
                  className="rounded-2xl whitespace-nowrap"
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Most Members
                </Button>
                <Button
                  variant={leaderboardFilter === 'rating' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardFilter('rating')}
                  className="rounded-2xl whitespace-nowrap"
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-1" />
                  Highest Rated
                </Button>
                <Button
                  variant={leaderboardFilter === 'engagement' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardFilter('engagement')}
                  className="rounded-2xl whitespace-nowrap"
                  size="sm"
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Member Engagement
                </Button>
              </div>

              {/* Leaderboard */}
              <div className="space-y-3">
                {sortedGyms.slice(0, 10).map((gym, idx) => {
                  const rankColors = {
                    0: 'from-yellow-400 to-yellow-500',
                    1: 'from-gray-300 to-gray-400',
                    2: 'from-orange-400 to-orange-500'
                  };
                  const rankIcons = {
                    0: '🥇',
                    1: '🥈',
                    2: '🥉'
                  };
                  
                  return (
                    <div
                      key={gym.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        gym.isOwner
                          ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-md'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg ${
                        idx < 3 ? `bg-gradient-to-br ${rankColors[idx]} shadow-lg` : 'bg-gray-400'
                      }`}>
                        {idx < 3 ? rankIcons[idx] : idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{gym.name}</h4>
                          {gym.isOwner && (
                            <Badge className="bg-blue-500 text-white">Your Gym</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            {gym.members} members
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {gym.rating.toFixed(1)}/5
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Activity className="w-4 h-4" />
                            {gym.engagementScore}% engaged
                          </span>
                        </div>
                      </div>
                      
                      {leaderboardFilter === 'overall' && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-blue-600">
                            {Math.round(gym.overallScore)}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      )}
                      {leaderboardFilter === 'members' && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-green-600">
                            {gym.members}
                          </div>
                          <div className="text-xs text-gray-500">Members</div>
                        </div>
                      )}
                      {leaderboardFilter === 'rating' && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-yellow-600">
                            {gym.rating.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                      )}
                      {leaderboardFilter === 'engagement' && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-purple-600">
                            {gym.engagementScore}%
                          </div>
                          <div className="text-xs text-gray-500">Engagement</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            {/* Gym Info */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Gym Information</h3>
                <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                  <Button variant="outline">View Public Page</Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Name</p>
                  <p className="text-gray-900 font-medium">{selectedGym?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Type</p>
                  <Badge className="capitalize">{selectedGym?.type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Location</p>
                  <p className="text-gray-900">{selectedGym?.city}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Price</p>
                  <p className="text-gray-900 font-bold">£{selectedGym?.price}/month</p>
                </div>
              </div>
              <Button
                onClick={() => setShowManagePhotos(true)}
                variant="outline"
                className="w-full mt-4"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Manage Photos
              </Button>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-6 h-6 text-purple-500" />
                  <p className="text-sm font-bold text-gray-500 uppercase">Rewards</p>
                </div>
                <p className="text-3xl font-black text-gray-900">{rewards.length}</p>
                <Button
                  onClick={() => setShowManageRewards(true)}
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                >
                  Manage
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6 text-blue-500" />
                  <p className="text-sm font-bold text-gray-500 uppercase">Classes</p>
                </div>
                <p className="text-3xl font-black text-gray-900">{classes.length}</p>
                <Button
                  onClick={() => setShowManageClasses(true)}
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                >
                  Manage
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-bold text-gray-500 uppercase">Coaches</p>
                </div>
                <p className="text-3xl font-black text-gray-900">{coaches.length}</p>
                <Button
                  onClick={() => setShowManageCoaches(true)}
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                >
                  Manage
                </Button>
              </Card>
            </div>

            {/* Recent Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
                <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Event
                  </Button>
                </Link>
              </div>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">{format(new Date(event.event_date), 'PPP')}</p>
                      </div>
                      <Badge>{event.attendees || 0} attending</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No upcoming events</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Gym Settings</h3>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Gym Details
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notification Preferences
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Business Settings
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <ManageRewardsModal
          open={showManageRewards}
          onClose={() => setShowManageRewards(false)}
          rewards={rewards}
          onCreateReward={(data) => createRewardMutation.mutate(data)}
          onDeleteReward={(id) => deleteRewardMutation.mutate(id)}
          gym={selectedGym}
          isLoading={createRewardMutation.isPending}
        />

        <ManageClassesModal
          open={showManageClasses}
          onClose={() => setShowManageClasses(false)}
          classes={classes}
          onCreateClass={(data) => createClassMutation.mutate(data)}
          onDeleteClass={(id) => deleteClassMutation.mutate(id)}
          gym={selectedGym}
          isLoading={createClassMutation.isPending}
        />

        <ManageCoachesModal
          open={showManageCoaches}
          onClose={() => setShowManageCoaches(false)}
          coaches={coaches}
          onCreateCoach={(data) => createCoachMutation.mutate(data)}
          onDeleteCoach={(id) => deleteCoachMutation.mutate(id)}
          gym={selectedGym}
          isLoading={createCoachMutation.isPending}
        />

        <ManageGymPhotosModal
          open={showManagePhotos}
          onClose={() => setShowManagePhotos(false)}
          gallery={selectedGym?.gallery || []}
          onSave={(gallery) => updateGalleryMutation.mutate(gallery)}
          isLoading={updateGalleryMutation.isPending}
        />

        <ManageMembersModal
          open={showManageMembers}
          onClose={() => setShowManageMembers(false)}
          gym={selectedGym}
          onBanMember={(userId) => banMemberMutation.mutate(userId)}
          onUnbanMember={(userId) => unbanMemberMutation.mutate(userId)}
        />
      </div>
    </div>
  );
}