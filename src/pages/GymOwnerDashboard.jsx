import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Trophy, Calendar, Star, Target, Award, Activity, Bell, Settings, Plus, Edit, Image as ImageIcon, Dumbbell, CheckCircle, Download, Share2, X, Crown, Trash2, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import CreateGymOwnerPostModal from '../components/gym/CreateGymOwnerPostModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import ManageAmenitiesModal from '../components/gym/ManageAmenitiesModal';
import EditBasicInfoModal from '../components/gym/EditBasicInfoModal';
import CreateEventModal from '../components/events/CreateEventModal';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import QRScanner from '../components/gym/QRScanner';

import QRCode from 'react-qr-code';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function GymOwnerDashboard() {
  const t = (key, options = {}) => {
    const translations = {
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Manage your gym and track performance',
      'dashboard.memberView': 'Member View',
      'dashboard.viewMyGym': 'View My Gym',
      'dashboard.managePost': 'Manage posts and events',
      'dashboard.activeMembers': 'Active Members',
      'dashboard.checkIns30d': 'Check-ins (30d)',
      'dashboard.activeThisWeek': 'Active This Week',
      'dashboard.weeklyChange': 'Weekly Change',
      'dashboard.vsLastWeek': 'vs Last Week',
      'dashboard.atRiskMembers': 'At-Risk Members',
      'dashboard.noCheckIn7to10': 'No check-in 7-10 days',
      'dashboard.membersAtRisk': 'Members At Risk',
      'dashboard.membersHaventCheckedIn': `${options.count || 0} members haven't checked in recently`,
      'dashboard.viewMembers': 'View Members',
      'dashboard.checkInsToday': 'Check-ins Today',
      'dashboard.membersCheckedIn': 'members checked in',
      'dashboard.uniqueMembers': 'unique members',
      'dashboard.whatToDoNext': 'What to Do Next',
      'dashboard.reachOutAtRisk': 'Reach out to at-risk members',
      'dashboard.shareGymUpdates': 'Share gym updates',
      'dashboard.keepMembersEngaged': 'Keep members engaged with content',
      'dashboard.createPost': 'Create Post',
      'dashboard.createChallenge': 'Create a challenge',
      'dashboard.boostEngagement': 'Boost engagement and retention',
      'dashboard.createChallengeBtn': 'Create Challenge',
      'dashboard.activityLog': 'Activity Log',
      'dashboard.checkedIn': 'checked in',
      'dashboard.noActivityLast7Days': 'No activity in the last 7 days',
      'dashboard.snapshot': 'Snapshot',
      'dashboard.engagement': 'Engagement',
      'dashboard.content': 'Content',
      'dashboard.admin': 'Admin',
      'dashboard.insights': 'Insights',
      'dashboard.engagementOverview': 'Engagement Overview',
      'dashboard.totalMembers': 'Total Members',
      'dashboard.active7days': 'Active (7 days)',
      'dashboard.totalCheckIns': 'Total Check-ins',
      'dashboard.prsLogged': 'PRs Logged',
      'dashboard.memberEngagementLevels': 'Member Engagement Levels',
      'dashboard.superActive': 'Super Active',
      'dashboard.visitsPerMonth15': '15+ visits per month',
      'dashboard.active': 'Active',
      'dashboard.visitsPerMonth8to14': '8-14 visits per month',
      'dashboard.casual': 'Casual',
      'dashboard.visitsPerMonth1to7': '1-7 visits per month',
      'dashboard.atRisk': 'At Risk',
      'dashboard.daysInactive': '7-10 days inactive',
      'dashboard.memberRetention': 'Member Retention',
      'dashboard.activeThisMonth': 'Active This Month',
      'dashboard.outOfTotal': `out of ${options.total || 0} total`,
      'dashboard.inactive30Plus': 'Inactive 30+ Days',
      'dashboard.considerReaching': 'Consider reaching out',
      'dashboard.retentionRate': 'Retention Rate',
      'dashboard.dayActiveRate': '30-day active rate',
      'dashboard.dayOfWeekAnalysis': 'Day of Week Analysis',
      'dashboard.newVsReturning': 'New vs Returning Members',
      'dashboard.firstTimeVisitors': 'First-Time Visitors',
      'dashboard.newMembersDiscovering': 'New members discovering your gym',
      'dashboard.returningMembers': 'Returning Members',
      'dashboard.loyalMembers': 'Loyal members',
      'dashboard.returnRate': 'Return Rate',
      'dashboard.returnRateDesc': 'Percentage of returning visits',
      'dashboard.weeklyLeaderboard': 'Weekly Leaderboard',
      'dashboard.topMembersThisWeek': 'Top members this week',
      'dashboard.visits': 'visits',
      'dashboard.rewardEffectiveness': 'Reward Effectiveness',
      'dashboard.activeRewards': 'Active Rewards',
      'dashboard.totalClaims': 'Total Claims',
      'dashboard.mostPopular': 'Most Popular',
      'dashboard.manageRewards': 'Manage Rewards',
      'dashboard.challengesEvents': 'Challenges & Events',
      'dashboard.createEvent': 'Create Event',
      'dashboard.activeChallenges': 'Active Challenges',
      'dashboard.noActiveChallenges': 'No active challenges',
      'dashboard.participants': 'participants',
      'dashboard.upcomingEvents': 'Upcoming Events',
      'dashboard.noUpcomingEvents': 'No upcoming events',
      'dashboard.gymFeedManagement': 'Gym Feed Management',
      'dashboard.noActivityYet': 'No activity yet',
      'dashboard.postsFromGym': 'Posts from your gym members will appear here',
      'dashboard.rewardsManagement': 'Rewards Management',
      'dashboard.addReward': 'Add Reward',
      'dashboard.gymProfileSetup': 'Gym Profile Setup',
      'dashboard.basicInformation': 'Basic Information',
      'dashboard.gymName': 'Gym Name',
      'dashboard.type': 'Type',
      'dashboard.location': 'Location',
      'dashboard.monthlyPrice': 'Monthly Price',
      'dashboard.amenities': 'Amenities',
      'dashboard.equipment': 'Equipment',
      'dashboard.more': 'more',
      'dashboard.photoGallery': 'Photo Gallery',
      'dashboard.managePhotos': 'Manage Photos',
      'dashboard.manageClasses': 'Manage Classes',
      'dashboard.classes': 'classes',
      'dashboard.manageCoaches': 'Manage Coaches',
      'dashboard.coaches': 'coaches',
      'dashboard.viewMembersBtn': 'View Members',
      'dashboard.members': 'members',
      'dashboard.adminAccess': 'Admin Access',
      'dashboard.ownerEmail': 'Owner Email',
      'dashboard.gymId': 'Gym ID',
      'dashboard.verifiedStatus': 'Verified Status',
      'dashboard.verified': 'Verified',
      'dashboard.notVerified': 'Not Verified',
      'dashboard.viewPublicGymPage': 'View Public Gym Page',
      'dashboard.weeklyCheckInTrend': 'Weekly Check-in Trend',
      'dashboard.attendanceOverWeeks': 'Attendance over the last 12 weeks',
      'dashboard.challengeParticipation': 'Challenge Participation',
      'dashboard.engagementTrend': 'Engagement trend over time',
      'dashboard.activeMembersGrowth': 'Active Members Growth',
      'dashboard.membersWhoCheckedIn': 'Members who checked in each month',
      'dashboard.rewardsRedeemedChart': 'Rewards Redeemed',
      'dashboard.trackIncentive': 'Track your most effective incentives',
      'dashboard.peakHoursAnalysis': 'Peak Hours Analysis',
      'dashboard.checkInTrends': 'Check-in Trends',
      'dashboard.last7Days': 'Last 7 Days',
      'dashboard.last30Days': 'Last 30 Days',
      'dashboard.checkInsLabel': 'check-ins',
      'dashboard.dailyAverage': 'Daily Average',
      'dashboard.perDay': 'per day',
      'dashboard.vsPreviousMonth': 'vs Previous Month',
      'dashboard.change': 'change',
      'dashboard.likes': 'likes',
      'dashboard.comments': 'comments',
      'dashboard.attending': 'attending',
    };
    return translations[key] || key;
  };
  const i18n = { language: 'en', changeLanguage: () => {} }; // Mock i18n
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
  const [showManageEquipment, setShowManageEquipment] = useState(false);
  const [showManageAmenities, setShowManageAmenities] = useState(false);
  const [showEditBasicInfo, setShowEditBasicInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const navigate = useNavigate();

  // Auto-refetch on mount to get latest user data
  React.useEffect(() => {
    refetchUser();
  }, []);

  // Redirect to onboarding if not completed
  React.useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser, navigate]);

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list(),
    enabled: !!currentUser
  });

  const myGyms = gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms = myGyms.filter(g => g.status === 'pending');

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
    if (approvedGyms.length > 0 && !selectedGym) {
      setSelectedGym(approvedGyms[0]);
    }
  }, [approvedGyms, selectedGym]);

  // Auto-switch language based on gym's language setting
  React.useEffect(() => {
    if (selectedGym?.language && i18n.language !== selectedGym.language) {
      i18n.changeLanguage(selectedGym.language);
    }
  }, [selectedGym, i18n]);

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

  const updateGymMutation = useMutation({
    mutationFn: (data) => base44.entities.Gym.update(selectedGym.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setShowManageEquipment(false);
      setShowManageAmenities(false);
      setShowEditBasicInfo(false);
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

  const deleteGymMutation = useMutation({
    mutationFn: () => base44.entities.Gym.delete(selectedGym.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setShowDeleteConfirm(false);
      window.location.href = createPageUrl('Gyms');
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

  // Show pending approval message if gym is pending
  if (approvedGyms.length === 0 && pendingGyms.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md bg-slate-800/60 border border-yellow-500/40">
          <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Gym Pending Approval</h2>
          <p className="text-slate-300 mb-4">
            Your gym <span className="font-bold text-yellow-400">{pendingGyms[0].name}</span> is currently under review. 
            You'll be notified once it's approved and can access your dashboard.
          </p>
          <Link to={createPageUrl('Home')}>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white">
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (myGyms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md bg-slate-800/60 border border-slate-600/40">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h2 className="text-2xl font-bold text-white mb-2">No Gyms Registered</h2>
          <p className="text-slate-300 mb-4">Register your gym to start managing it</p>
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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-8 md:mb-12">
           <div>
             <h1 className="text-4xl md:text-6xl font-black text-white mb-2 md:mb-4 tracking-tight" style={{letterSpacing: '-0.5px'}}>{t('dashboard.title')}</h1>
             <p className="text-slate-400 text-sm md:text-base font-medium">{t('dashboard.subtitle')}</p>
           </div>

          <div className="flex flex-col gap-3 items-stretch sm:items-end">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Link to={createPageUrl('Home')} className="w-full sm:w-auto">
                <Button variant="outline" className="border-2 h-12 px-4 md:px-6 w-full">
                  <Users className="w-5 h-5 mr-2" />
                  {t('dashboard.memberView')}
                </Button>
              </Link>

              <Button 
                onClick={() => base44.auth.logout()} 
                variant="outline" 
                className="border-2 h-12 px-4 md:px-6 w-full sm:w-auto text-red-500 hover:bg-red-50 border-red-300"
              >
                Log out
              </Button>

              {approvedGyms.length > 1 && (
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 sm:pb-0">
                  {approvedGyms.map(gym => (
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

            {/* Retention Pro Upgrade */}
            <Link to={createPageUrl('Plus')} className="block">
              <Card className="p-3 bg-slate-800/50 border border-purple-500/30 hover:border-purple-500/50 hover:bg-slate-800/70 transition-all cursor-pointer">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-xs font-bold text-white">Retention Pro</h3>
                      <p className="text-[10px] text-slate-400">Advanced tools • From £49.99/mo</p>
                    </div>
                  </div>
                  <span className="text-xs text-purple-400 font-medium whitespace-nowrap">Learn More →</span>
                </div>
              </Card>
            </Link>
          </div>
        </div>

         {/* View My Gym */}
         <div className="mb-6">
           <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id} className="block">
             <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-auto py-6 flex-col gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 border-0">
               <Dumbbell className="w-8 h-8" />
               <span className="font-black text-lg">{t('dashboard.viewMyGym')}</span>
               <span className="text-sm text-blue-100 font-medium">{t('dashboard.managePost')}</span>
             </Button>
           </Link>
         </div>

        <Tabs defaultValue="snapshot" className="w-full mb-8">
           <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6 bg-slate-800/50 border border-slate-700 backdrop-blur-sm p-1 md:p-1.5 rounded-xl h-auto md:h-14 shadow-xl gap-1">
             <TabsTrigger value="snapshot" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               📊 {t('dashboard.snapshot')}
             </TabsTrigger>
             <TabsTrigger value="engagement" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               🔥 {t('dashboard.engagement')}
             </TabsTrigger>
             <TabsTrigger value="content" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               📸 {t('dashboard.content')}
             </TabsTrigger>
             <TabsTrigger value="admin" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               ⚙️ {t('dashboard.admin')}
             </TabsTrigger>
             <TabsTrigger value="insights" className="rounded-lg font-semibold text-xs md:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:border-slate-600 data-[state=active]:shadow-md transition-all duration-200 border border-transparent">
               📈 {t('dashboard.insights')}
             </TabsTrigger>
           </TabsList>

          <TabsContent value="snapshot" className="space-y-6 md:space-y-8 mt-4 md:mt-6">
            {/* Check-ins Today */}
            <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2">{t('dashboard.checkInsToday')}</h3>
                  <p className="text-slate-400">{todayCheckIns} {t('dashboard.membersCheckedIn')}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </Card>

            {/* What to Do Next */}
            <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <h3 className="text-xl md:text-2xl font-black text-white mb-6">{t('dashboard.whatToDoNext')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-blue-500/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 flex-shrink-0">
                    <Bell className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{t('dashboard.reachOutAtRisk')}</h4>
                    <p className="text-sm text-slate-400 mb-3">{t('dashboard.membersHaventCheckedIn', { count: atRiskMembers })}</p>
                    <Button size="sm" onClick={() => setShowManageMembers(true)} className="bg-slate-600 hover:bg-slate-500">
                      {t('dashboard.viewMembers')}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-blue-500/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                    <Plus className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{t('dashboard.shareGymUpdates')}</h4>
                    <p className="text-sm text-slate-400 mb-3">{t('dashboard.keepMembersEngaged')}</p>
                    <Button size="sm" onClick={() => setShowCreatePost(true)} className="bg-slate-600 hover:bg-slate-500">
                      {t('dashboard.createPost')}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:border-blue-500/50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{t('dashboard.createChallenge')}</h4>
                    <p className="text-sm text-slate-400 mb-3">{t('dashboard.boostEngagement')}</p>
                    <Button size="sm" onClick={() => setShowCreateChallenge(true)} className="bg-slate-600 hover:bg-slate-500">
                      {t('dashboard.createChallengeBtn')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Log */}
            <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <h3 className="text-xl md:text-2xl font-black text-white mb-6">{t('dashboard.activityLog')}</h3>
              {checkIns.slice(0, 10).length > 0 ? (
                <div className="space-y-3">
                  {checkIns.slice(0, 10).map((checkIn, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-white font-medium">{checkIn.user_name || 'Member'}</span>
                      <span className="text-slate-400 text-sm">{t('dashboard.checkedIn')}</span>
                      <span className="text-slate-500 text-sm ml-auto">{format(new Date(checkIn.check_in_date), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">{t('dashboard.noActivityLast7Days')}</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-8 mt-4 md:mt-6">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <h3 className="text-xl md:text-2xl font-black text-white mb-6">{t('dashboard.engagementOverview')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.totalMembers')}</p>
                  <p className="text-3xl font-black text-white">{uniqueMembers}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.active7days')}</p>
                  <p className="text-3xl font-black text-white">{activeMembersThisWeek}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.totalCheckIns')}</p>
                  <p className="text-3xl font-black text-white">{checkIns.length}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.prsLogged')}</p>
                  <p className="text-3xl font-black text-white">{lifts.filter(l => l.is_pr).length}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-8 mt-4 md:mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
                <h3 className="text-xl font-black text-white mb-4">{t('dashboard.challengesEvents')}</h3>
                <div className="space-y-4 mb-4">
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
                    <p className="text-slate-400 text-sm mb-1">{t('dashboard.activeChallenges')}</p>
                    <p className="text-2xl font-black text-white">{challenges.filter(c => c.status === 'active').length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600/50">
                    <p className="text-slate-400 text-sm mb-1">{t('dashboard.upcomingEvents')}</p>
                    <p className="text-2xl font-black text-white">{events.filter(e => new Date(e.event_date) > new Date()).length}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCreateChallenge(true)} className="flex-1 bg-slate-600 hover:bg-slate-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Challenge
                  </Button>
                  <Button onClick={() => setShowCreateEvent(true)} className="flex-1 bg-slate-600 hover:bg-slate-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Event
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
                <h3 className="text-xl font-black text-white mb-4">{t('dashboard.gymFeedManagement')}</h3>
                <div className="space-y-3 mb-4">
                  {posts.slice(0, 3).length > 0 ? (
                    posts.slice(0, 3).map((post, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/50">
                        <p className="text-white font-medium text-sm">{post.member_name}</p>
                        <p className="text-slate-400 text-xs line-clamp-2">{post.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4">{t('dashboard.noActivityYet')}</p>
                  )}
                </div>
                <Button onClick={() => setShowCreatePost(true)} className="w-full bg-slate-600 hover:bg-slate-500">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboard.createPost')}
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-8 mt-4 md:mt-6">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <h3 className="text-xl md:text-2xl font-black text-white mb-6">{t('dashboard.gymProfileSetup')}</h3>
              
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-white">{t('dashboard.basicInformation')}</h4>
                    <Button size="sm" onClick={() => setShowEditBasicInfo(true)} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{t('dashboard.gymName')}</p>
                      <p className="text-white font-medium">{selectedGym?.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{t('dashboard.type')}</p>
                      <p className="text-white font-medium">{selectedGym?.type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{t('dashboard.location')}</p>
                      <p className="text-white font-medium">{selectedGym?.city}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{t('dashboard.monthlyPrice')}</p>
                      <p className="text-white font-medium">{selectedGym?.price || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{t('dashboard.amenities')}</h4>
                      <Button size="sm" onClick={() => setShowManageAmenities(true)} variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-slate-400">{selectedGym?.amenities?.length || 0} {t('dashboard.amenities')}</p>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{t('dashboard.equipment')}</h4>
                      <Button size="sm" onClick={() => setShowManageEquipment(true)} variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-slate-400">{selectedGym?.equipment?.length || 0} {t('dashboard.equipment')}</p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-white">{t('dashboard.photoGallery')}</h4>
                    <Button size="sm" onClick={() => setShowManagePhotos(true)} variant="outline">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {t('dashboard.managePhotos')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedGym?.gallery?.slice(0, 6).map((photo, idx) => (
                      <img key={idx} src={photo} alt="Gym" className="w-full h-24 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{t('dashboard.manageClasses')}</h4>
                      <Button size="sm" onClick={() => setShowManageClasses(true)} variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-slate-400">{classes.length} {t('dashboard.classes')}</p>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white">{t('dashboard.manageCoaches')}</h4>
                      <Button size="sm" onClick={() => setShowManageCoaches(true)} variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-slate-400">{coaches.length} {t('dashboard.coaches')}</p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
                  <h4 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h4>
                  <p className="text-slate-400 text-sm mb-4">Permanently delete this gym and all associated data</p>
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Gym
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6 mt-4 md:mt-6">
            <Card className="p-6 md:p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl">
              <h3 className="text-xl md:text-2xl font-black text-white mb-6">{t('dashboard.checkInTrends')}</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.last7Days')}</p>
                  <p className="text-3xl font-black text-white">{last7Days}</p>
                  <p className="text-slate-500 text-xs mt-1">{t('dashboard.checkInsLabel')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.last30Days')}</p>
                  <p className="text-3xl font-black text-white">{last30Days}</p>
                  <p className="text-slate-500 text-xs mt-1">{t('dashboard.checkInsLabel')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <p className="text-slate-400 text-sm mb-2">{t('dashboard.dailyAverage')}</p>
                  <p className="text-3xl font-black text-white">{(last30Days / 30).toFixed(1)}</p>
                  <p className="text-slate-500 text-xs mt-1">{t('dashboard.perDay')}</p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={checkInsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                  <Bar dataKey="checkIns" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Gym Join Code with QR Code - Compact Version */}
         <Card className="p-4 mb-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white border-0 shadow-xl">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
               <CheckCircle className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <h3 className="font-bold text-base mb-0.5">🎯 Gym Join Code</h3>
               <p className="text-white/90 text-xs">Scan QR or enter code to join</p>
             </div>

             {selectedGym?.join_code ? (
               <>
                 <div className="bg-white/25 backdrop-blur px-3 py-2 rounded-xl border border-white/40">
                   <p className="text-2xl font-black text-white tracking-wider">{selectedGym.join_code}</p>
                 </div>

                 <button
                   onClick={() => setShowQRCodeModal(true)}
                   className="bg-white p-2 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                 >
                   <div id="qr-code-container">
                     <QRCode 
                       value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym.join_code}`}
                       size={80}
                       level="H"
                     />
                   </div>
                 </button>

                 <Button
                   onClick={() => {
                     const svg = document.getElementById('qr-code-container').querySelector('svg');
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
                   size="sm"
                   className="bg-white/90 hover:bg-white text-green-700 font-semibold px-3"
                 >
                   <Download className="w-3 h-3" />
                 </Button>
               </>
             ) : (
               <Button
                 onClick={async () => {
                   // Generate unique 6-character code
                   const generateCode = async () => {
                     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                     let code;
                     let isUnique = false;
                     let attempts = 0;

                     while (!isUnique && attempts < 10) {
                       code = '';
                       for (let i = 0; i < 6; i++) {
                         code += chars.charAt(Math.floor(Math.random() * chars.length));
                       }

                       // Check if code already exists
                       const existing = await base44.entities.Gym.filter({ join_code: code });
                       isUnique = existing.length === 0;
                       attempts++;
                     }

                     return code;
                   };

                   const code = await generateCode();
                   await base44.entities.Gym.update(selectedGym.id, { join_code: code });
                   queryClient.invalidateQueries({ queryKey: ['gyms'] });
                 }}
                 size="sm"
                 className="bg-white text-green-600 hover:bg-white/90 font-semibold"
               >
                 Generate
               </Button>
             )}
           </div>
         </Card>

         {/* At-Risk Alert */}
        {atRiskMembers > 0 && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl mb-2">⚠️ {t('dashboard.membersAtRisk')}</h3>
                <p className="text-white/90">
                  {t('dashboard.membersHaventCheckedIn', { count: atRiskMembers })}
                </p>
              </div>
              <Button
                onClick={() => setShowManageMembers(true)}
                variant="outline"
                className="bg-white/20 hover:bg-white/30 border-white/50 text-white font-semibold px-8 py-6 rounded-xl shadow-lg"
              >
                {t('dashboard.viewMembers')}
              </Button>
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
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{t('dashboard.activeMembers')}</p>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
                <Activity className="w-6 md:w-7 h-6 md:h-7 text-emerald-400" />
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 text-xs font-semibold">{last7Days} wk</Badge>
            </div>
            <div className="text-3xl md:text-4xl font-black mb-1 text-white">{last30Days}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{t('dashboard.checkIns30d')}</p>
          </Card>

          <Card className="p-4 md:p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
                <Activity className="w-6 md:w-7 h-6 md:h-7 text-orange-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl md:text-4xl font-black mb-1 text-white">{activeMembersThisWeek}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{t('dashboard.activeThisWeek')}</p>
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
         <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
           <Button
            onClick={() => setShowQRScanner(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 border-0"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-1">
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="font-bold text-sm md:text-base text-white">Scan QR</span>
          </Button>
          <Button
            onClick={() => setShowManageMembers(true)}
            className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-700 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-1 border border-blue-500/30">
              <Users className="w-6 h-6 md:w-7 md:h-7 text-blue-400" />
            </div>
            <span className="font-bold text-sm md:text-base">{i18n.language === 'es' ? 'Miembros' : 'Members'}</span>
          </Button>
          <Button
            onClick={() => setShowManageRewards(true)}
            className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-700 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-1 border border-purple-500/30">
              <Award className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
            </div>
            <span className="font-bold text-sm md:text-base">{i18n.language === 'es' ? 'Recompensas' : 'Rewards'}</span>
          </Button>
          <Button
            onClick={() => setShowManageClasses(true)}
            className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-700 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-1 border border-green-500/30">
              <Calendar className="w-6 h-6 md:w-7 md:h-7 text-green-400" />
            </div>
            <span className="font-bold text-sm md:text-base">{i18n.language === 'es' ? 'Clases' : 'Classes'}</span>
          </Button>
          <Button
            onClick={() => setShowManageCoaches(true)}
            className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-700 h-auto py-8 md:py-10 flex-col gap-2 md:gap-3 shadow-xl hover:shadow-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-1 border border-orange-500/30">
              <Target className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
            </div>
            <span className="font-bold text-sm md:text-base">{i18n.language === 'es' ? 'Entrenadores' : 'Coaches'}</span>
          </Button>
        </div>



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

        <ManageEquipmentModal
          open={showManageEquipment}
          onClose={() => setShowManageEquipment(false)}
          equipment={selectedGym?.equipment || []}
          onSave={(equipment) => updateGymMutation.mutate({ equipment })}
          isLoading={updateGymMutation.isPending}
        />

        <ManageAmenitiesModal
          open={showManageAmenities}
          onClose={() => setShowManageAmenities(false)}
          amenities={selectedGym?.amenities || []}
          onSave={(amenities) => updateGymMutation.mutate({ amenities })}
          isLoading={updateGymMutation.isPending}
        />

        <EditBasicInfoModal
          open={showEditBasicInfo}
          onClose={() => setShowEditBasicInfo(false)}
          gym={selectedGym}
          onSave={(data) => updateGymMutation.mutate(data)}
          isLoading={updateGymMutation.isPending}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="bg-slate-900 border border-red-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-400" />
                Delete Gym Permanently?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300">
                This will permanently delete <span className="font-bold text-white">{selectedGym?.name}</span> and all associated data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All check-in history</li>
                  <li>Rewards and classes</li>
                  <li>Events and challenges</li>
                  <li>Member relationships</li>
                </ul>
                <p className="mt-3 font-bold text-red-400">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteGymMutation.mutate()}
                disabled={deleteGymMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteGymMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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