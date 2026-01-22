import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Trophy, Calendar, Star, Target, Award, Activity, Bell, Settings, Plus, Edit, Image as ImageIcon, Dumbbell, CheckCircle, Download, Share2, X, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import CreateEventModal from '../components/events/CreateEventModal';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import QRScanner from '../components/gym/QRScanner';
import QRCode from 'react-qr-code';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function GymOwnerDashboard() {
  const [selectedGym, setSelectedGym] = useState(null);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState('overall');
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
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
    enabled: !!currentUser && !!selectedGym,
    staleTime: 30000 // Cache for 30 seconds
  });

  const { data: allMemberships = [] } = useQuery({
    queryKey: ['allMemberships'],
    queryFn: () => base44.entities.GymMembership.list(),
    enabled: !!currentUser && !!selectedGym,
    staleTime: 30000
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser && !!selectedGym,
    staleTime: 30000
  });

  React.useEffect(() => {
    if (myGyms.length > 0 && !selectedGym) {
      setSelectedGym(myGyms[0]);
    }
  }, [myGyms, selectedGym]);



  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', selectedGym?.id],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }),
    enabled: !!selectedGym,
    staleTime: 20000
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts', selectedGym?.id],
    queryFn: async () => {
      const allLifts = await base44.entities.Lift.list();
      return allLifts.filter(l => l.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym && !!checkIns,
    staleTime: 30000
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', selectedGym?.id],
    queryFn: async () => {
      const allRewards = await base44.entities.Reward.list();
      return allRewards.filter(r => r.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym && !!checkIns,
    staleTime: 30000
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', selectedGym?.id],
    queryFn: async () => {
      const allClasses = await base44.entities.GymClass.list();
      return allClasses.filter(c => c.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym && !!checkIns,
    staleTime: 30000
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches', selectedGym?.id],
    queryFn: async () => {
      const allCoaches = await base44.entities.Coach.list();
      return allCoaches.filter(c => c.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym && !!checkIns,
    staleTime: 30000
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', selectedGym?.id],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list();
      return allEvents.filter(e => e.gym_id === selectedGym.id);
    },
    enabled: !!selectedGym && !!checkIns,
    staleTime: 30000
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
    enabled: !!selectedGym && checkIns.length > 0,
    staleTime: 20000
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', selectedGym?.id],
    queryFn: async () => {
      const allChallenges = await base44.entities.Challenge.list('-created_date');
      return allChallenges.filter(c => c.gym_id === selectedGym?.id || c.competing_gym_id === selectedGym?.id);
    },
    enabled: !!selectedGym && !!checkIns,
    staleTime: 30000
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

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.Event.create({
      ...eventData,
      gym_id: selectedGym.id,
      gym_name: selectedGym.name,
      attendees: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', selectedGym.id] });
      setShowCreateEvent(false);
    }
  });

  const createChallengeMutation = useMutation({
    mutationFn: (challengeData) => base44.entities.Challenge.create({
      ...challengeData,
      gym_id: selectedGym.id,
      gym_name: selectedGym.name,
      participants: [],
      status: 'upcoming'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges', selectedGym.id] });
      setShowCreateChallenge(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        {/* Premium Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard</h1>
                  <p className="text-slate-400 text-sm">{selectedGym?.name || 'Gym Management'}</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm ml-15">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {myGyms.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {myGyms.map(gym => (
                    <Button
                      key={gym.id}
                      variant={selectedGym?.id === gym.id ? 'default' : 'outline'}
                      onClick={() => setSelectedGym(gym)}
                      className={`whitespace-nowrap ${selectedGym?.id === gym.id ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
                    >
                      {gym.name}
                    </Button>
                  ))}
                </div>
              )}
              <Link to={createPageUrl('Home')} className="ml-auto">
                <Button variant="outline" className="border-slate-700 text-slate-400 hover:text-slate-200">
                  <Users className="w-4 h-4 mr-2" />
                  Member View
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Join Code & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* QR Code Card */}
          <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-800 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Gym Join Code</h3>
              {selectedGym?.join_code && (
                <button
                  onClick={() => setShowQRCodeModal(true)}
                  className="text-slate-400 hover:text-slate-200 transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedGym && selectedGym.join_code ? (
               <div className="space-y-3">
                 <div className="bg-slate-900 p-3 rounded-lg flex items-center justify-between">
                   <span className="font-mono text-lg font-black text-cyan-400">{selectedGym?.join_code}</span>
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(selectedGym.join_code)} className="h-8 w-8 p-0">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
                <Button 
                  onClick={async () => {
                    const svg = document.getElementById('qr-code-container')?.querySelector('svg');
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg);
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      const img = new Image();
                      img.onload = () => {
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        const pngFile = canvas.toDataURL('image/png');
                        const downloadLink = document.createElement('a');
                        downloadLink.download = `${selectedGym.name}-QR-Code.png`;
                        downloadLink.href = pngFile;
                        downloadLink.click();
                      };
                      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                    }
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 h-8 text-xs"
                >
                  Download QR
                </Button>
              </div>
            ) : (
              <Button 
                onClick={async () => {
                  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                  await base44.entities.Gym.update(selectedGym.id, { join_code: code });
                  queryClient.invalidateQueries({ queryKey: ['gyms'] });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 h-10"
              >
                Generate Code
              </Button>
            )}
            <div id="qr-code-container" className="hidden">
              <QRCode 
                value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym.join_code}`}
                size={80}
                level="H"
              />
            </div>
          </Card>

          {/* View Community */}
          <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id} className="md:col-span-2">
            <Card className="h-full p-6 bg-gradient-to-br from-cyan-600 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer group">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-sm opacity-90 mb-1">Community Hub</h3>
                  <p className="text-2xl font-black">View & Manage</p>
                </div>
                <div className="flex items-center gap-2 opacity-75 group-hover:opacity-100 transition">
                  <Dumbbell className="w-5 h-5" />
                  <span className="text-sm">Go to community →</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

         {/* At-Risk Alert */}
         {atRiskMembers > 0 && (
           <Card className="p-5 mb-6 bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-700/50 shadow-lg">
             <div className="flex items-start gap-4">
               <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                 <Bell className="w-5 h-5 text-red-400" />
               </div>
               <div className="flex-1">
                 <h3 className="font-semibold text-white mb-1">{atRiskMembers} Members At Risk</h3>
                 <p className="text-slate-300 text-sm mb-3">
                   {atRiskMembers} member{atRiskMembers > 1 ? 's have' : ' has'} not checked in for 7-10 days
                 </p>
                 <Button
                   onClick={() => setShowManageMembers(true)}
                   className="bg-red-600 hover:bg-red-700 h-8 text-xs"
                 >
                   Review Members
                 </Button>
               </div>
             </div>
           </Card>
         )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
          <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Users className="w-6 md:w-7 h-6 md:h-7 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl md:text-4xl font-black mb-1 text-white">{uniqueMembers}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Active Members</p>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
                <Activity className="w-6 md:w-7 h-6 md:h-7 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 text-xs font-semibold">{last7Days} wk</Badge>
            </div>
            <div className="text-3xl md:text-4xl font-black mb-1 text-white">{last30Days}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Check-ins (30d)</p>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
                <Activity className="w-6 md:w-7 h-6 md:h-7 text-orange-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl md:text-4xl font-black mb-1 text-white">{activeMembersThisWeek}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Active This Week</p>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
                <Star className="w-6 md:w-7 h-6 md:h-7 text-amber-400" />
              </div>
              <span className="text-lg md:text-xl font-bold text-amber-400">{selectedGym?.rating?.toFixed(1) || '0.0'}/5</span>
            </div>
            <div className="text-3xl md:text-4xl font-black mb-1 text-white">{selectedGym?.rating?.toFixed(1) || '0.0'}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Avg Rating</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Button
            onClick={() => setShowQRScanner(true)}
            className="bg-emerald-600 hover:bg-emerald-700 h-24 flex-col gap-2 rounded-lg border-0 shadow-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-xs font-semibold">Scan</span>
          </Button>
          <Button
            onClick={() => setShowManageMembers(true)}
            className="bg-slate-700 hover:bg-slate-600 h-24 flex-col gap-2 rounded-lg border border-slate-600 shadow-lg transition-all"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs font-semibold">Members</span>
          </Button>
          <Button
            onClick={() => setShowManageRewards(true)}
            className="bg-slate-700 hover:bg-slate-600 h-24 flex-col gap-2 rounded-lg border border-slate-600 shadow-lg transition-all"
          >
            <Award className="w-5 h-5" />
            <span className="text-xs font-semibold">Rewards</span>
          </Button>
          <Button
            onClick={() => setShowManageClasses(true)}
            className="bg-slate-700 hover:bg-slate-600 h-24 flex-col gap-2 rounded-lg border border-slate-600 shadow-lg transition-all"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-semibold">Classes</span>
          </Button>
          <Button
            onClick={() => setShowManageCoaches(true)}
            className="bg-slate-700 hover:bg-slate-600 h-24 flex-col gap-2 rounded-lg border border-slate-600 shadow-lg transition-all"
          >
            <Target className="w-5 h-5" />
            <span className="text-xs font-semibold">Coaches</span>
          </Button>
        </div>

        <Tabs defaultValue="snapshot" className="w-full">
           <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 md:mb-10 bg-slate-800/50 border border-slate-700 backdrop-blur-sm p-1 md:p-1.5 rounded-xl h-auto md:h-14 shadow-xl gap-1">
             <TabsTrigger value="snapshot" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               📊 Snapshot
             </TabsTrigger>
             <TabsTrigger value="engagement" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               🔥 Engagement
             </TabsTrigger>
             <TabsTrigger value="content" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               📸 Content
             </TabsTrigger>
             <TabsTrigger value="admin" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               ⚙️ Admin
             </TabsTrigger>
             <TabsTrigger value="insights" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               📈 Insights
             </TabsTrigger>
           </TabsList>

          <TabsContent value="snapshot" className="space-y-6 md:space-y-8 mt-4 md:mt-6">
            {/* Today/This Week Snapshot */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
               <Card className="p-5 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                 <p className="text-blue-200 font-medium mb-3 text-xs md:text-sm uppercase tracking-wide">Check-ins Today</p>
                 <p className="text-4xl md:text-5xl font-black mb-2">{todayCheckIns}</p>
                 <p className="text-xs text-blue-200">Members checked in</p>
               </Card>

               <Card className="p-5 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                 <p className="text-emerald-200 font-medium mb-3 text-xs md:text-sm uppercase tracking-wide">Active This Week</p>
                 <p className="text-4xl md:text-5xl font-black mb-2">{activeMembersThisWeek}</p>
                 <p className="text-xs text-emerald-200">Unique members</p>
               </Card>

               <Card className="p-5 md:p-6 bg-gradient-to-br from-violet-600 to-violet-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                 <p className="text-violet-200 font-medium mb-3 text-xs md:text-sm uppercase tracking-wide">Weekly Change</p>
                 <div className="flex items-baseline gap-1 mb-2">
                   <p className="text-4xl md:text-5xl font-black">{weeklyChange > 0 ? '+' : ''}{weeklyChange}</p>
                   <span className="text-base md:text-lg font-semibold opacity-90">({weeklyChangePercent > 0 ? '+' : ''}{weeklyChangePercent}%)</span>
                 </div>
                 <p className="text-xs text-violet-200">vs Last Week</p>
               </Card>

               <Card className="p-5 md:p-6 bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all">
                 <p className="text-red-200 font-medium mb-3 text-xs md:text-sm uppercase tracking-wide">At-Risk Members</p>
                 <p className="text-4xl md:text-5xl font-black mb-2">{atRiskMembers}</p>
                 <p className="text-xs text-red-200">No check-in 7-10 days</p>
               </Card>
             </div>

            {/* What to Do Next */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
                What to do next
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
                        <p className="text-sm text-gray-600">Keep members engaged with posts</p>
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
                        <p className="text-sm text-gray-600">Boost engagement with challenges</p>
                        <Button onClick={() => setShowCreateChallenge(true)} size="sm" className="mt-2">
                          Create Challenge
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Activity Log (Last 7 Days) */}
            <Card className="p-8 bg-white border-0 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h3>
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
                  <p className="text-gray-500 text-center py-8">No activity in last 7 days</p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-8 mt-4 md:mt-6">
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
                  <p className="text-sm text-gray-600 mb-1">Total Check-Ins</p>
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
              <p className="text-gray-600 mb-4">Top members this week</p>
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
                  <p className="text-sm text-gray-600 mb-1">{t('dashboard.totalClaims')}</p>
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

          <TabsContent value="content" className="space-y-8 mt-4 md:mt-6">
            {/* Challenges & Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Challenges & Events</h3>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreateEvent(true)} className="bg-gray-900 hover:bg-gray-800 text-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                  <Button onClick={() => setShowCreateChallenge(true)}>
                    <Trophy className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>
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
                {events.filter(e => new Date(e.event_date) >= new Date()).length > 0 ? (
                  <div className="space-y-3">
                    {events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 5).map(event => (
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
                  <p className="text-sm text-gray-400">Posts from your gym members will appear here</p>
                </div>
              )}
            </Card>

            {/* Rewards Management */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{t('dashboard.rewardsManagement')}</h3>
                <Button onClick={() => setShowManageRewards(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboard.addReward')}
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

          <TabsContent value="admin" className="space-y-8 mt-4 md:mt-6">
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
            {/* Member Engagement Breakdown */}
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.memberEngagementLevels')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.superActive')}</p>
                  <p className="text-4xl font-black">
                    {Object.values(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, {})).filter(count => count >= 15).length}
                  </p>
                  <p className="text-xs opacity-75">{t('dashboard.visitsPerMonth15')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.active')}</p>
                  <p className="text-4xl font-black">
                    {Object.values(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, {})).filter(count => count >= 8 && count < 15).length}
                  </p>
                  <p className="text-xs opacity-75">{t('dashboard.visitsPerMonth8to14')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.casual')}</p>
                  <p className="text-4xl font-black">
                    {Object.values(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, {})).filter(count => count >= 1 && count < 8).length}
                  </p>
                  <p className="text-xs opacity-75">{t('dashboard.visitsPerMonth1to7')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.atRisk')}</p>
                  <p className="text-4xl font-black">{atRiskMembers}</p>
                  <p className="text-xs opacity-75">{t('dashboard.daysInactive')}</p>
                </div>
              </div>
            </Card>

            {/* Member Retention & Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t('dashboard.memberRetention')}</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Active This Month</p>
                    <p className="text-3xl font-black text-green-600">
                      {new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).map(c => c.user_id)).size}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Out of {uniqueMembers} total</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Inactive 30+ days</p>
                    <p className="text-3xl font-black text-orange-600">
                      {(() => {
                        const activeIds = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).map(c => c.user_id));
                        const allMemberIds = new Set(checkIns.map(c => c.user_id));
                        return allMemberIds.size - activeIds.size;
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Consider reaching out</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
                    <p className="text-sm text-gray-600 mb-1">Retention Rate</p>
                    <p className="text-3xl font-black text-blue-600">
                      {uniqueMembers > 0 ? Math.round((new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).map(c => c.user_id)).size / uniqueMembers) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">30-day active rate</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Day of Week Analysis</h3>
                <div className="space-y-3">
                  {(() => {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayData = {};
                    checkIns.forEach(c => {
                      const day = new Date(c.check_in_date).getDay();
                      dayData[day] = (dayData[day] || 0) + 1;
                    });
                    const sortedDays = days.map((name, idx) => ({ name, count: dayData[idx] || 0, idx }))
                      .sort((a, b) => b.count - a.count);
                    
                    return sortedDays.map(({ name, count, idx }, rank) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-orange-600">#{rank + 1}</span>
                          <span className="font-medium text-gray-900">{name}</span>
                        </div>
                        <span className="text-xl font-black text-orange-600">{count}</span>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            </div>

            {/* Member Check-in Trends */}
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Check-In Trends</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const last7DaysCheckIns = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() }));
                  const last14DaysCheckIns = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 14), end: subDays(new Date(), 7) }));
                  const last30DaysCheckIns = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() }));
                  const previousMonthCheckIns = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 60), end: subDays(new Date(), 30) }));
                  
                  return (
                    <>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">Last 7 Days</p>
                        <p className="text-3xl font-black text-blue-600">{last7DaysCheckIns.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Check-ins</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">Last 30 Days</p>
                        <p className="text-3xl font-black text-green-600">{last30DaysCheckIns.length}</p>
                        <p className="text-xs text-gray-500 mt-1">Check-ins</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">Daily Average</p>
                        <p className="text-3xl font-black text-purple-600">{Math.round(last30DaysCheckIns.length / 30)}</p>
                        <p className="text-xs text-gray-500 mt-1">Per day</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">vs Previous Month</p>
                        <p className="text-3xl font-black text-orange-600">
                          {previousMonthCheckIns.length > 0 ? 
                            (((last30DaysCheckIns.length - previousMonthCheckIns.length) / previousMonthCheckIns.length) * 100).toFixed(0) 
                            : 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Change</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            {/* Peak Hours Analysis */}
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Peak Hours Analysis</h3>
              <div className="space-y-3">
                {(() => {
                  const hourlyData = {};
                  checkIns.forEach(c => {
                    const hour = new Date(c.check_in_date).getHours();
                    hourlyData[hour] = (hourlyData[hour] || 0) + 1;
                  });
                  const sorted = Object.entries(hourlyData)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10);
                  
                  return sorted.map(([hour, count], idx) => {
                    const h = parseInt(hour);
                    const timeLabel = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                    const endH = (h + 1) % 24;
                    const endLabel = endH === 0 ? '12am' : endH < 12 ? `${endH}am` : endH === 12 ? '12pm' : `${endH - 12}pm`;
                    
                    return (
                      <div key={hour} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-purple-600">#{idx + 1}</span>
                          <span className="font-medium text-gray-900">{timeLabel} - {endLabel}</span>
                        </div>
                        <span className="text-xl font-black text-purple-600">{count}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            {/* Reward Engagement */}
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Reward Engagement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const totalRewardClaims = rewards.reduce((sum, r) => sum + (r.claimed_by?.length || 0), 0);
                  const usersEarningRewards = new Set(rewards.flatMap(r => r.claimed_by || [])).size;
                  const percentEarning = uniqueMembers > 0 ? Math.round((usersEarningRewards / uniqueMembers) * 100) : 0;
                  const avgRewardsPerUser = uniqueMembers > 0 ? (totalRewardClaims / uniqueMembers).toFixed(1) : 0;
                  
                  return (
                    <>
                      <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">Users Earning Rewards</p>
                        <p className="text-4xl font-black text-purple-600">{percentEarning}%</p>
                        <p className="text-xs text-gray-500 mt-1">Of {uniqueMembers} members</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">Total Claims</p>
                        <p className="text-4xl font-black text-blue-600">{totalRewardClaims}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('dashboard.rewardsRedeemed')}</p>
                      </div>
                      <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                        <p className="text-sm text-gray-600 mb-1">Avg Rewards Per User</p>
                        <p className="text-4xl font-black text-green-600">{avgRewardsPerUser}</p>
                        <p className="text-xs text-gray-500 mt-1">Rewards per member</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            {/* Average Visit Duration & Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <h4 className="font-bold text-gray-700 mb-3">Avg Visits per Member</h4>
                <p className="text-5xl font-black text-purple-600">
                  {uniqueMembers > 0 ? (checkIns.length / uniqueMembers).toFixed(1) : 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">All-time average</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
                <h4 className="font-bold text-gray-700 mb-3">Monthly Average</h4>
                <p className="text-5xl font-black text-blue-600">
                  {uniqueMembers > 0 ? (last30Days / uniqueMembers).toFixed(1) : 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Visits per member (30d)</p>
              </Card>
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <h4 className="font-bold text-gray-700 mb-3">Weekly Average</h4>
                <p className="text-5xl font-black text-green-600">
                  {activeMembersThisWeek > 0 ? (last7Days / activeMembersThisWeek).toFixed(1) : 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">Visits per active member (7d)</p>
              </Card>
            </div>

            {/* Member Engagement Breakdown */}
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.memberEngagementLevels')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.superActive')}</p>
                  <p className="text-4xl font-black">
                    {checkIns.reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, Object.fromEntries(Object.keys(checkIns.reduce((acc, c) => ({ ...acc, [c.user_id]: true }), {})).map(id => [id, 0]))).pipe = Object.values(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, {})).filter(count => count >= 15).length}
                  </p>
                  <p className="text-xs opacity-75">{t('dashboard.visitsPerMonth15')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.active')}</p>
                  <p className="text-4xl font-black">
                    {Object.values(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, {})).filter(count => count >= 8 && count < 15).length}
                  </p>
                  <p className="text-xs opacity-75">{t('dashboard.visitsPerMonth8to14')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.casual')}</p>
                  <p className="text-4xl font-black">
                    {Object.values(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).reduce((acc, c) => {
                      acc[c.user_id] = (acc[c.user_id] || 0) + 1;
                      return acc;
                    }, {})).filter(count => count >= 1 && count < 8).length}
                  </p>
                  <p className="text-xs opacity-75">{t('dashboard.visitsPerMonth1to7')}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-2xl">
                  <p className="text-sm mb-1 opacity-90">{t('dashboard.atRisk')}</p>
                  <p className="text-4xl font-black">{atRiskMembers}</p>
                  <p className="text-xs opacity-75">{t('dashboard.daysInactive')}</p>
                </div>
              </div>
            </Card>



            {/* First Visit vs Returning Members */}
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">New vs Returning</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-green-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">First Time Visitors</span>
                    <span className="text-3xl font-black text-green-600">
                      {checkIns.filter(c => c.first_visit).length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">New members discovering</p>
                </div>
                <div className="p-5 bg-blue-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Returning Members</span>
                    <span className="text-3xl font-black text-blue-600">
                      {checkIns.filter(c => !c.first_visit).length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Loyal members</p>
                </div>
                <div className="p-5 bg-purple-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-700">Return Rate</span>
                    <span className="text-3xl font-black text-purple-600">
                      {checkIns.length > 0 ? Math.round((checkIns.filter(c => !c.first_visit).length / checkIns.length) * 100) : 0}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Return rate %</p>
                </div>
              </div>
            </Card>

            {/* Retention Graphs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Check-in Trend */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Weekly Check-In Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={(() => {
                    const data = [];
                    for (let i = 11; i >= 0; i--) {
                      const weekStart = subDays(new Date(), i * 7);
                      const weekEnd = subDays(new Date(), (i - 1) * 7);
                      const weekCheckIns = checkIns.filter(c => 
                        isWithinInterval(new Date(c.check_in_date), { start: weekStart, end: weekEnd })
                      );
                      data.push({
                        week: format(weekStart, 'MMM d'),
                        checkIns: weekCheckIns.length
                      });
                    }
                    return data;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} name="Check-ins" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-3 text-center">Attendance over weeks</p>
              </Card>

              {/* Challenge Participation Over Time */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Challenge Participation</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const data = [];
                    for (let i = 5; i >= 0; i--) {
                      const monthStart = subDays(new Date(), i * 30);
                      const monthEnd = subDays(new Date(), (i - 1) * 30);
                      const monthChallenges = challenges.filter(c => 
                        isWithinInterval(new Date(c.start_date), { start: monthStart, end: monthEnd })
                      );
                      const totalParticipants = monthChallenges.reduce((sum, c) => sum + (c.participants?.length || 0), 0);
                      data.push({
                        month: format(monthStart, 'MMM'),
                        participants: totalParticipants
                      });
                    }
                    return data;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="participants" fill="#f59e0b" name="Participants" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-3 text-center">Engagement trend</p>
              </Card>

              {/* Active Members Growth */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Active Members Growth</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={(() => {
                    const data = [];
                    for (let i = 5; i >= 0; i--) {
                      const monthEnd = subDays(new Date(), i * 30);
                      const monthStart = subDays(monthEnd, 30);
                      const activeMembers = new Set(
                        checkIns.filter(c => 
                          isWithinInterval(new Date(c.check_in_date), { start: monthStart, end: monthEnd })
                        ).map(c => c.user_id)
                      ).size;
                      data.push({
                        month: format(monthEnd, 'MMM'),
                        members: activeMembers
                      });
                    }
                    return data;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="members" stroke="#10b981" strokeWidth={2} name="Active Members" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-3 text-center">Members who checked in</p>
              </Card>

              {/* Rewards Redeemed */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Rewards Redeemed</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const rewardClaims = {};
                    rewards.forEach(reward => {
                      const claimCount = reward.claimed_by?.length || 0;
                      if (claimCount > 0) {
                        rewardClaims[reward.title] = claimCount;
                      }
                    });
                    return Object.entries(rewardClaims)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([title, claims]) => ({
                        reward: title.length > 15 ? title.substring(0, 15) + '...' : title,
                        claims
                      }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="reward" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="claims" fill="#8b5cf6" name="Claims" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-3 text-center">Track incentive effectiveness</p>
              </Card>
            </div>
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
                {events.filter(e => new Date(e.event_date) >= new Date()).length > 0 ? (
                  <div className="space-y-3">
                    {events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 5).map(event => (
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
              {events.filter(e => new Date(e.event_date) >= new Date()).length > 0 ? (
                <div className="space-y-3">
                  {events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 3).map(event => (
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

        <CreateEventModal
          open={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          onSave={(data) => createEventMutation.mutate(data)}
          gym={selectedGym}
          isLoading={createEventMutation.isPending}
        />

        <CreateChallengeModal
          open={showCreateChallenge}
          onClose={() => setShowCreateChallenge(false)}
          gyms={gyms}
        />

        <QRScanner
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
        />

        {/* QR Code Fullscreen Modal */}
        {showQRCodeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white max-w-md w-full p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Gym Join QR Code</h3>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowQRCodeModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="flex justify-center mb-6 p-6 bg-white rounded-2xl border-2 border-gray-200">
                <div id="qr-code-fullscreen">
                  <QRCode 
                    value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym.join_code}`}
                    size={300}
                    level="H"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Code: <span className="font-bold text-gray-900">{selectedGym.join_code}</span>
                </p>
                
                <Button
                  onClick={() => {
                    const svg = document.getElementById('qr-code-fullscreen').querySelector('svg');
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = `${selectedGym.name}-QR-Code.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>

                <Button
                  onClick={() => setShowQRCodeModal(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}