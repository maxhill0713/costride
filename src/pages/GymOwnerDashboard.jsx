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
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function GymOwnerDashboard() {
  const [selectedGym, setSelectedGym] = useState(null);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
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

  const { data: posts = [] } = useQuery({
    queryKey: ['posts', selectedGym?.id],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.list('-created_date');
      return allPosts.filter(p => {
        const postCheckIns = checkIns.filter(c => c.user_id === p.member_id);
        return postCheckIns.length > 0;
      });
    },
    enabled: !!selectedGym && checkIns.length > 0
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', selectedGym?.id],
    queryFn: async () => {
      const allChallenges = await base44.entities.Challenge.list('-created_date');
      return allChallenges.filter(c => c.gym_id === selectedGym?.id || c.competing_gym_id === selectedGym?.id);
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

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GymClass.update(id, data),
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

  // Today's check-ins
  const todayCheckIns = checkIns.filter(c => {
    const checkInDate = startOfDay(new Date(c.check_in_date));
    return checkInDate.getTime() === startOfDay(new Date()).getTime();
  }).length;

  // Active members this week (unique users)
  const activeMembersThisWeek = new Set(checkIns.filter(c => {
    const checkInDate = new Date(c.check_in_date);
    return isWithinInterval(checkInDate, { start: subDays(new Date(), 7), end: new Date() });
  }).map(c => c.user_id)).size;

  // Last week's active members for comparison
  const activeMembersLastWeek = new Set(checkIns.filter(c => {
    const checkInDate = new Date(c.check_in_date);
    return isWithinInterval(checkInDate, { start: subDays(new Date(), 14), end: subDays(new Date(), 7) });
  }).map(c => c.user_id)).size;

  // Weekly attendance change
  const weeklyChange = activeMembersThisWeek - activeMembersLastWeek;
  const weeklyChangePercent = activeMembersLastWeek > 0 
    ? Math.round((weeklyChange / activeMembersLastWeek) * 100) 
    : 0;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 p-5 md:p-8 pb-24 md:pb-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 md:gap-6 mb-8 md:mb-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 md:mb-3 tracking-tight">Gym Owner Dashboard</h1>
            <p className="text-gray-600 text-sm md:text-lg">Manage your gym and track performance with precision</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center">
            <Link to={createPageUrl('Home')} className="w-full sm:w-auto">
              <Button variant="outline" className="border-2 h-12 px-4 md:px-6 w-full">
                <Users className="w-5 h-5 mr-2" />
                Member View
              </Button>
            </Link>
            
            {myGyms.length > 1 && (
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 sm:pb-0">
                {myGyms.map(gym => (
                  <Button
                    key={gym.id}
                    variant={selectedGym?.id === gym.id ? 'default' : 'outline'}
                    onClick={() => setSelectedGym(gym)}
                    className="whitespace-nowrap h-12 px-4 md:px-6"
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
          <Card className="p-5 md:p-6 mb-6 md:mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl mb-2">⚠️ Members At Risk</h3>
                <p className="text-white/90">
                  {atRiskMembers} {atRiskMembers === 1 ? 'member hasn\'t' : 'members haven\'t'} checked in for 7-10 days this week
                </p>
              </div>
              <Button
                onClick={() => setShowManageMembers(true)}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 border-white/50 text-white font-semibold px-8 py-6 rounded-xl shadow-lg"
              >
                View Members
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-8">
          <Card className="p-4 md:p-8 bg-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <div className="text-3xl md:text-5xl font-black mb-1 md:mb-2 text-gray-900">{uniqueMembers}</div>
            <p className="text-gray-500 text-xs md:text-base font-semibold uppercase tracking-wide">Active Members</p>
          </Card>

          <Card className="p-4 md:p-8 bg-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <Badge className="bg-green-50 text-green-700 border border-green-200 px-2 md:px-3 py-1 text-xs md:text-sm font-semibold">{last7Days} week</Badge>
            </div>
            <div className="text-3xl md:text-5xl font-black mb-1 md:mb-2 text-gray-900">{last30Days}</div>
            <p className="text-gray-500 text-xs md:text-base font-semibold uppercase tracking-wide">Check-ins (30d)</p>
          </Card>

          <Card className="p-4 md:p-8 bg-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <Activity className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
            </div>
            <div className="text-3xl md:text-5xl font-black mb-1 md:mb-2 text-gray-900">{activeMembersThisWeek}</div>
            <p className="text-gray-500 text-xs md:text-base font-semibold uppercase tracking-wide">Active This Week</p>
          </Card>

          <Card className="p-4 md:p-8 bg-white border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Star className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <span className="text-xl md:text-3xl font-bold text-purple-600">{selectedGym?.rating?.toFixed(1) || '0.0'}/5</span>
            </div>
            <div className="text-3xl md:text-5xl font-black mb-1 md:mb-2 text-gray-900">{selectedGym?.rating?.toFixed(1) || '0.0'}</div>
            <p className="text-gray-500 text-xs md:text-base font-semibold uppercase tracking-wide">Average Rating</p>
            <p className="text-xs text-gray-400 mt-2 md:mt-3 italic hidden md:block">Only you can see this rating</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-4 mb-8 md:mb-8">
          <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id} className="col-span-2 md:col-span-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 border-0">
              <Dumbbell className="w-8 h-8 md:w-10 md:h-10" />
              <span className="font-black text-lg md:text-xl">View My Gym</span>
              <span className="text-xs md:text-sm text-blue-100 font-medium">Manage & Post</span>
            </Button>
          </Link>
          <Button
            onClick={() => setShowManageMembers(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-0 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-1">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
            </div>
            <span className="font-bold text-sm md:text-base text-gray-900">Members</span>
          </Button>
          <Button
            onClick={() => setShowManageRewards(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-0 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-1">
              <Award className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
            </div>
            <span className="font-bold text-sm md:text-base text-gray-900">Rewards</span>
          </Button>
          <Button
            onClick={() => setShowManageClasses(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-0 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-1">
              <Calendar className="w-6 h-6 md:w-7 md:h-7 text-green-600" />
            </div>
            <span className="font-bold text-sm md:text-base text-gray-900">Classes</span>
          </Button>
          <Button
            onClick={() => setShowManageCoaches(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border-0 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center mb-1">
              <Target className="w-6 h-6 md:w-7 md:h-7 text-orange-600" />
            </div>
            <span className="font-bold text-sm md:text-base text-gray-900">Coaches</span>
          </Button>
        </div>

        <Tabs defaultValue="snapshot" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 md:mb-10 bg-white border-0 p-1.5 md:p-2 rounded-2xl h-14 md:h-16 shadow-xl overflow-x-auto">
            <TabsTrigger value="snapshot" className="rounded-xl font-semibold text-xs md:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              Snapshot
            </TabsTrigger>
            <TabsTrigger value="engagement" className="rounded-xl font-semibold text-xs md:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              Engagement
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl font-semibold text-xs md:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              Content
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-xl font-semibold text-xs md:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              Admin
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl font-semibold text-xs md:text-base data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200">
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="snapshot" className="space-y-6 md:space-y-8 mt-6 md:mt-6">
            {/* Today/This Week Snapshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
              <Card className="p-6 md:p-8 bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
                <p className="text-blue-100 font-semibold mb-3 text-xs md:text-sm">Check-ins Today</p>
                <p className="text-4xl md:text-6xl font-black mb-1">{todayCheckIns}</p>
                <p className="text-xs md:text-sm text-blue-100">members checked in</p>
              </Card>

              <Card className="p-5 md:p-8 bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                <p className="text-green-100 font-semibold mb-2 text-xs md:text-sm">Active This Week</p>
                <p className="text-4xl md:text-6xl font-black mb-1">{activeMembersThisWeek}</p>
                <p className="text-xs md:text-sm text-green-100">unique members</p>
              </Card>

              <Card className="p-5 md:p-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                <p className="text-purple-100 font-semibold mb-2 text-xs md:text-sm">Weekly Change</p>
                <div className="flex items-baseline gap-1 md:gap-2 mb-1">
                  <p className="text-4xl md:text-6xl font-black">{weeklyChange > 0 ? '+' : ''}{weeklyChange}</p>
                  <span className="text-lg md:text-2xl font-bold opacity-80">({weeklyChangePercent > 0 ? '+' : ''}{weeklyChangePercent}%)</span>
                </div>
                <p className="text-xs md:text-sm text-purple-100">vs last week</p>
              </Card>

              <Card className="p-5 md:p-8 bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg">
                <p className="text-orange-100 font-semibold mb-2 text-xs md:text-sm">At-Risk Members</p>
                <p className="text-4xl md:text-6xl font-black mb-1">{atRiskMembers}</p>
                <p className="text-xs md:text-sm text-orange-100">no check-in 7-10 days</p>
              </Card>
            </div>

            {/* What to Do Next */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
                What to Do Next
              </h3>
              <div className="space-y-3">
                {atRiskMembers > 0 && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-orange-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-bold text-gray-900">Reach out to at-risk members</p>
                        <p className="text-sm text-gray-600">{atRiskMembers} members haven't checked in recently</p>
                        <Button onClick={() => setShowManageMembers(true)} size="sm" className="mt-2">
                          View Members
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {posts.length < 3 && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-blue-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📸</span>
                      <div>
                        <p className="font-bold text-gray-900">Share gym updates</p>
                        <p className="text-sm text-gray-600">Keep members engaged with regular posts</p>
                        <Button onClick={() => setShowCreatePost(true)} size="sm" className="mt-2">
                          Create Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {challenges.filter(c => c.status === 'active').length === 0 && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-green-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="font-bold text-gray-900">Create a challenge</p>
                        <p className="text-sm text-gray-600">Boost engagement with a gym challenge</p>
                        <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                          <Button size="sm" className="mt-2">
                            Create Challenge
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Activity Log (Last 7 Days) */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Activity Log (Last 7 Days)</h3>
              <div className="space-y-3">
                {checkIns
                  .filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() }))
                  .slice(0, 15)
                  .map((checkIn, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {checkIn.user_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{checkIn.user_name}</p>
                          <p className="text-sm text-gray-600">Checked in</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{format(new Date(checkIn.check_in_date), 'MMM d, h:mm a')}</span>
                    </div>
                  ))}
                {checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() })).length === 0 && (
                  <p className="text-gray-500 text-center py-8">No activity in the last 7 days</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6 md:space-y-8 mt-6 md:mt-6">
            {/* Engagement Overview */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Engagement Overview</h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Total Members</p>
                  <p className="text-3xl font-black text-blue-600">{uniqueMembers}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Active (7 days)</p>
                  <p className="text-3xl font-black text-green-600">{activeMembersThisWeek}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Total Check-ins</p>
                  <p className="text-3xl font-black text-purple-600">{last7Days}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">PRs Logged</p>
                  <p className="text-3xl font-black text-orange-600">{lifts.filter(l => l.is_pr).length}</p>
                </div>
              </div>
            </Card>

            {/* Weekly Leaderboard */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Weekly Leaderboard</h3>
              <p className="text-gray-600 mb-4">Top members this week by check-ins</p>
              <div className="space-y-3">
                {Object.entries(
                  checkIns
                    .filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() }))
                    .reduce((acc, c) => {
                      acc[c.user_name] = (acc[c.user_name] || 0) + 1;
                      return acc;
                    }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([name, count], idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <Link 
                        key={name} 
                        to={createPageUrl('Leaderboard')}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-white">
                            {idx < 3 ? medals[idx] : idx + 1}
                          </div>
                          <span className="font-bold text-gray-900">{name}</span>
                        </div>
                        <Badge className="text-lg px-3">{count} visits</Badge>
                      </Link>
                    );
                  })}
              </div>
            </Card>

            {/* Reward Effectiveness */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Reward Effectiveness</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-purple-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Active Rewards</p>
                  <p className="text-3xl font-black text-purple-600">{rewards.filter(r => r.active).length}</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Total Claims</p>
                  <p className="text-3xl font-black text-pink-600">
                    {rewards.reduce((sum, r) => sum + (r.claimed_by?.length || 0), 0)}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl">
                  <p className="text-sm text-gray-600 mb-1">Most Popular</p>
                  <p className="text-lg font-bold text-orange-600">
                    {rewards.sort((a, b) => (b.claimed_by?.length || 0) - (a.claimed_by?.length || 0))[0]?.title || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => setShowManageRewards(true)} variant="outline" className="w-full">
                  Manage Rewards
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6 md:space-y-8 mt-6 md:mt-6">
            {/* Challenges & Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Challenges & Events</h3>
                <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </Link>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Active Challenges</h4>
                {challenges.filter(c => c.status === 'active').length > 0 ? (
                  <div className="space-y-3">
                    {challenges.filter(c => c.status === 'active').map(challenge => (
                      <div key={challenge.id} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-bold text-gray-900">{challenge.title}</h5>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                          <Badge className="bg-orange-500 text-white">{challenge.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <span>👥 {challenge.participants?.length || 0} participants</span>
                          <span>📅 {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">No active challenges</p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Upcoming Events</h4>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.slice(0, 5).map(event => (
                      <div key={event.id} className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-900">{event.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span>📅 {format(new Date(event.event_date), 'PPP')}</span>
                              <span>👥 {event.attendees || 0} attending</span>
                            </div>
                          </div>
                          {event.image_url && (
                            <img src={event.image_url} alt={event.title} className="w-20 h-20 rounded-xl object-cover ml-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">No upcoming events</p>
                )}
              </div>
            </Card>

            {/* Gym Feed Management */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Gym Feed Management</h3>
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.slice(0, 10).map(post => (
                    <div key={post.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {post.member_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{post.member_name}</p>
                          <p className="text-sm text-gray-500">{format(new Date(post.created_date), 'PPp')}</p>
                        </div>
                      </div>
                      <p className="text-gray-900 mb-3">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="Post" className="w-full rounded-xl mb-3" />
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>❤️ {post.likes || 0} likes</span>
                        <span>💬 {post.comments?.length || 0} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No activity yet</p>
                  <p className="text-sm text-gray-400">Posts from your gym will appear here</p>
                </div>
              )}
            </Card>

            {/* Rewards Management */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Rewards Management</h3>
                <Button onClick={() => setShowManageRewards(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reward
                </Button>
              </div>
              
              {rewards.length > 0 ? (
                <div className="grid grid-cols-3 gap-6">
                  {rewards.slice(0, 6).map(reward => (
                    <div key={reward.id} className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{reward.icon || '🎁'}</div>
                        <Badge className={reward.active ? 'bg-green-500' : 'bg-gray-400'}>{reward.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{reward.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 font-bold">{reward.value}</span>
                        <span className="text-gray-500">{reward.claimed_by?.length || 0} claimed</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No rewards yet</p>
                  <p className="text-sm text-gray-400">Create rewards to incentivize member engagement</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6 md:space-y-8 mt-6 md:mt-6">
            {/* Gym Profile Setup */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Gym Profile Setup</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-700 mb-3 text-lg">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Gym Name</label>
                      <p className="text-gray-900 font-medium mt-1">{selectedGym?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Type</label>
                      <Badge className="capitalize mt-1">{selectedGym?.type}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Location</label>
                      <p className="text-gray-900 mt-1">{selectedGym?.address}, {selectedGym?.city} {selectedGym?.postcode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Monthly Price</label>
                      <p className="text-gray-900 font-bold mt-1">£{selectedGym?.price}/month</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGym?.amenities?.map((amenity, idx) => (
                      <Badge key={idx} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Equipment</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGym?.equipment?.slice(0, 15).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50">{item}</Badge>
                    ))}
                    {selectedGym?.equipment?.length > 15 && (
                      <Badge variant="outline">+{selectedGym.equipment.length - 15} more</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-700">Photo Gallery</h4>
                    <Button onClick={() => setShowManagePhotos(true)} variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Manage Photos
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedGym?.gallery?.slice(0, 6).map((url, idx) => (
                      <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover rounded-xl" />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Button onClick={() => setShowManageClasses(true)} variant="outline" className="h-auto py-6 flex-col gap-3">
                    <Calendar className="w-8 h-8" />
                    <span className="font-bold text-base">Manage Classes</span>
                    <span className="text-sm text-gray-500">{classes.length} classes</span>
                  </Button>
                  <Button onClick={() => setShowManageCoaches(true)} variant="outline" className="h-auto py-6 flex-col gap-3">
                    <Target className="w-8 h-8" />
                    <span className="font-bold text-base">Manage Coaches</span>
                    <span className="text-sm text-gray-500">{coaches.length} coaches</span>
                  </Button>
                  <Button onClick={() => setShowManageMembers(true)} variant="outline" className="h-auto py-6 flex-col gap-3">
                    <Users className="w-8 h-8" />
                    <span className="font-bold text-base">View Members</span>
                    <span className="text-sm text-gray-500">{uniqueMembers} members</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Admin Access */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Admin Access</h3>
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Owner Email</p>
                  <p className="text-gray-900 font-medium">{selectedGym?.owner_email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Gym ID</p>
                  <p className="text-gray-900 font-mono text-sm">{selectedGym?.id}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Verified Status</p>
                  <Badge className={selectedGym?.verified ? 'bg-green-500' : 'bg-gray-400'}>
                    {selectedGym?.verified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                  <Button variant="outline" className="w-full">
                    View Public Gym Page
                  </Button>
                </Link>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-4 md:mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Coming Soon</h3>
              <p className="text-gray-600">Advanced insights and analytics will be available here.</p>
            </Card>
          </TabsContent>

          <TabsContent value="oldanalytics" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Gym Activity Feed</h3>
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </div>
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.slice(0, 10).map(post => (
                    <div key={post.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {post.member_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{post.member_name}</p>
                          <p className="text-sm text-gray-500">{format(new Date(post.created_date), 'PPp')}</p>
                        </div>
                      </div>
                      <p className="text-gray-900 mb-3">{post.content}</p>
                      {post.image_url && (
                        <img src={post.image_url} alt="Post" className="w-full rounded-xl mb-3" />
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>❤️ {post.likes || 0} likes</span>
                        <span>💬 {post.comments?.length || 0} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No activity yet</p>
                  <p className="text-sm text-gray-400">Posts from your gym members will appear here</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="olddata" className="space-y-6">
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

          <TabsContent value="oldleaderboard" className="space-y-6">
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

          <TabsContent value="oldchallenges" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Challenges & Events</h3>
                <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New
                  </Button>
                </Link>
              </div>
              
              {/* Challenges */}
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Active Challenges</h4>
                {challenges.filter(c => c.status === 'active').length > 0 ? (
                  <div className="space-y-3">
                    {challenges.filter(c => c.status === 'active').map(challenge => (
                      <div key={challenge.id} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border-2 border-orange-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-bold text-gray-900">{challenge.title}</h5>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                          <Badge className="bg-orange-500 text-white">{challenge.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                          <span>👥 {challenge.participants?.length || 0} participants</span>
                          <span>📅 {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">No active challenges</p>
                )}
              </div>

              {/* Events */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">Upcoming Events</h4>
                {events.length > 0 ? (
                  <div className="space-y-3">
                    {events.slice(0, 5).map(event => (
                      <div key={event.id} className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-900">{event.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span>📅 {format(new Date(event.event_date), 'PPP')}</span>
                              <span>👥 {event.attendees || 0} attending</span>
                            </div>
                          </div>
                          {event.image_url && (
                            <img src={event.image_url} alt={event.title} className="w-20 h-20 rounded-xl object-cover ml-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">No upcoming events</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="oldrewards" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Rewards Program</h3>
                <Button onClick={() => setShowManageRewards(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reward
                </Button>
              </div>
              
              {rewards.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {rewards.map(reward => (
                    <div key={reward.id} className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{reward.icon || '🎁'}</div>
                        <Badge className={reward.active ? 'bg-green-500' : 'bg-gray-400'}>{reward.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{reward.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 font-bold">{reward.value}</span>
                        <span className="text-gray-500">{reward.claimed_by?.length || 0} claimed</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No rewards yet</p>
                  <p className="text-sm text-gray-400">Create rewards to incentivize member engagement</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="oldprofile" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Gym Profile</h3>
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Basic Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Gym Name</label>
                      <p className="text-gray-900 font-medium mt-1">{selectedGym?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Type</label>
                      <Badge className="capitalize mt-1">{selectedGym?.type}</Badge>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Location</label>
                      <p className="text-gray-900 mt-1">{selectedGym?.address}, {selectedGym?.city} {selectedGym?.postcode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Monthly Price</label>
                      <p className="text-gray-900 font-bold mt-1">£{selectedGym?.price}/month</p>
                    </div>
                  </div>
                </div>

                {/* Amenities & Equipment */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGym?.amenities?.map((amenity, idx) => (
                      <Badge key={idx} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Equipment</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGym?.equipment?.slice(0, 15).map((item, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50">{item}</Badge>
                    ))}
                    {selectedGym?.equipment?.length > 15 && (
                      <Badge variant="outline">+{selectedGym.equipment.length - 15} more</Badge>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-700">Photo Gallery</h4>
                    <Button onClick={() => setShowManagePhotos(true)} variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Manage Photos
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedGym?.gallery?.slice(0, 6).map((url, idx) => (
                      <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover rounded-xl" />
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-3">
                  <Button onClick={() => setShowManageClasses(true)} variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Calendar className="w-6 h-6" />
                    <span className="font-bold">Manage Classes</span>
                    <span className="text-xs text-gray-500">{classes.length} classes</span>
                  </Button>
                  <Button onClick={() => setShowManageCoaches(true)} variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Target className="w-6 h-6" />
                    <span className="font-bold">Manage Coaches</span>
                    <span className="text-xs text-gray-500">{coaches.length} coaches</span>
                  </Button>
                  <Button onClick={() => setShowManageMembers(true)} variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Users className="w-6 h-6" />
                    <span className="font-bold">View Members</span>
                    <span className="text-xs text-gray-500">{uniqueMembers} members</span>
                  </Button>
                </div>
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
          onUpdateClass={(id, data) => updateClassMutation.mutate({ id, data })}
          onDeleteClass={(id) => deleteClassMutation.mutate(id)}
          gym={selectedGym}
          isLoading={createClassMutation.isPending || updateClassMutation.isPending}
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

        <CreateGymOwnerPostModal
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          gym={selectedGym}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['posts', selectedGym?.id] });
          }}
        />
      </div>
    </div>
  );
}