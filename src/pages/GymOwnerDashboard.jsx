import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Trophy, Calendar, Star, Target, Award, Activity, Bell, Settings, Plus, Edit, Image as ImageIcon, Dumbbell, CheckCircle, Download, Share2, X, Crown, Trash2, Clock, Gift, ChevronRight, Zap, BarChart2, Shield, Eye } from 'lucide-react';
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
import CreatePollModal from '../components/polls/CreatePollModal';
import QRCode from 'react-qr-code';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ─── Micro components ──────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, iconColor, iconBg, label, value, sub, trend, trendValue }) => (
  <div className="relative overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/60 p-5 backdrop-blur-sm hover:border-slate-600 transition-all duration-300 group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trendValue ?? trend)}%
        </div>
      )}
    </div>
    <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</div>
    {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
  </div>
);

const SectionHeader = ({ icon, title, badge, action, actionLabel }) => (
  <div className="flex items-center gap-3 mb-6">
    {icon && <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-base">{icon}</div>}
    <h3 className="text-lg font-bold text-white">{title}</h3>
    {badge !== undefined && (
      <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-slate-700 text-slate-300 rounded-full">{badge}</span>
    )}
    {action && (
      <button onClick={action} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all">
        <Plus className="w-3.5 h-3.5" />
        {actionLabel || 'Add'}
      </button>
    )}
  </div>
);

const GlassCard = ({ children, className = '', glow }) => (
  <div className={`relative rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm overflow-hidden ${glow ? 'shadow-lg shadow-blue-500/10' : ''} ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative">{children}</div>
  </div>
);

const ActionButton = ({ icon: Icon, label, sub, onClick, gradient, border }) => (
  <button onClick={onClick} className={`relative group flex flex-col items-center justify-center gap-2.5 rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${gradient} ${border}`}>
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-sm font-bold text-white">{label}</span>
    {sub && <span className="text-xs text-white/60">{sub}</span>}
  </button>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-sm">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-bold">{p.value} {p.name}</p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Component ─────────────────────────────────────────────────────────────

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
      'dashboard.noCheckIn7to10': 'No check-in 7–10 days',
      'dashboard.membersAtRisk': 'Members At Risk',
      'dashboard.membersHaventCheckedIn': `${options.count || 0} members haven't checked in recently`,
      'dashboard.viewMembers': 'View Members',
      'dashboard.checkInsToday': 'Check-ins Today',
      'dashboard.membersCheckedIn': 'members checked in',
      'dashboard.uniqueMembers': 'unique members',
      'dashboard.whatToDoNext': 'Action Items',
      'dashboard.reachOutAtRisk': 'Reach out to at-risk members',
      'dashboard.shareGymUpdates': 'Share gym updates',
      'dashboard.keepMembersEngaged': 'Keep members engaged with content',
      'dashboard.createPost': 'Create Post',
      'dashboard.createChallenge': 'Create a challenge',
      'dashboard.boostEngagement': 'Boost engagement and retention',
      'dashboard.createChallengeBtn': 'Create Challenge',
      'dashboard.activityLog': 'Recent Activity',
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
      'dashboard.visitsPerMonth15': '15+ visits/mo',
      'dashboard.active': 'Active',
      'dashboard.visitsPerMonth8to14': '8–14 visits/mo',
      'dashboard.casual': 'Casual',
      'dashboard.visitsPerMonth1to7': '1–7 visits/mo',
      'dashboard.atRisk': 'At Risk',
      'dashboard.daysInactive': '7–10 days inactive',
      'dashboard.memberRetention': 'Member Retention',
      'dashboard.activeThisMonth': 'Active This Month',
      'dashboard.outOfTotal': `out of ${options.total || 0} total`,
      'dashboard.inactive30Plus': 'Inactive 30+ Days',
      'dashboard.considerReaching': 'Consider reaching out',
      'dashboard.retentionRate': 'Retention Rate',
      'dashboard.dayActiveRate': '30-day active rate',
      'dashboard.dayOfWeekAnalysis': 'Busiest Days',
      'dashboard.newVsReturning': 'New vs Returning Members',
      'dashboard.firstTimeVisitors': 'First-Time Visitors',
      'dashboard.newMembersDiscovering': 'New members discovering your gym',
      'dashboard.returningMembers': 'Returning Members',
      'dashboard.loyalMembers': 'Loyal members',
      'dashboard.returnRate': 'Return Rate',
      'dashboard.returnRateDesc': 'Percentage of returning visits',
      'dashboard.weeklyLeaderboard': 'Weekly Leaderboard',
      'dashboard.topMembersThisWeek': 'Top members this week by check-ins',
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
      'dashboard.gymFeedManagement': 'Gym Feed',
      'dashboard.noActivityYet': 'No activity yet',
      'dashboard.postsFromGym': 'Posts from your gym members will appear here',
      'dashboard.rewardsManagement': 'Rewards Program',
      'dashboard.addReward': 'Add Reward',
      'dashboard.gymProfileSetup': 'Gym Profile',
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
      'dashboard.manageClasses': 'Classes',
      'dashboard.classes': 'classes',
      'dashboard.manageCoaches': 'Coaches',
      'dashboard.coaches': 'coaches',
      'dashboard.viewMembersBtn': 'Members',
      'dashboard.members': 'members',
      'dashboard.adminAccess': 'Admin Access',
      'dashboard.ownerEmail': 'Owner Email',
      'dashboard.gymId': 'Gym ID',
      'dashboard.verifiedStatus': 'Verified Status',
      'dashboard.verified': 'Verified',
      'dashboard.notVerified': 'Not Verified',
      'dashboard.viewPublicGymPage': 'View Public Gym Page',
      'dashboard.weeklyCheckInTrend': 'Check-in Trend',
      'dashboard.attendanceOverWeeks': 'Attendance over the last 12 weeks',
      'dashboard.challengeParticipation': 'Challenge Participation',
      'dashboard.engagementTrend': 'Engagement trend over time',
      'dashboard.activeMembersGrowth': 'Active Members Growth',
      'dashboard.membersWhoCheckedIn': 'Members who checked in each month',
      'dashboard.rewardsRedeemedChart': 'Rewards Redeemed',
      'dashboard.trackIncentive': 'Most effective incentives',
      'dashboard.peakHoursAnalysis': 'Peak Hours',
      'dashboard.checkInTrends': 'Check-in Trends',
      'dashboard.last7Days': 'Last 7 Days',
      'dashboard.last30Days': 'Last 30 Days',
      'dashboard.checkInsLabel': 'check-ins',
      'dashboard.dailyAverage': 'Daily Average',
      'dashboard.perDay': 'per day',
      'dashboard.vsPreviousMonth': 'vs Prev. Month',
      'dashboard.change': 'change',
    };
    return translations[key] || key;
  };

  const i18n = { language: 'en', changeLanguage: () => {} };

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
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser, navigate]);

  const { data: gyms = [], isLoading: gymsLoading, error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn: () => base44.entities.Gym.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser?.email,
    retry: 3,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const myGyms = gyms.filter(g => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter(g => g.status === 'approved');
  const pendingGyms = myGyms.filter(g => g.status === 'pending');

  if (gymsError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <GlassCard className="p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Error Loading Gyms</h2>
          <p className="text-slate-400 mb-6">{gymsError.message || 'Failed to load gym data'}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white">
            Retry
          </Button>
        </GlassCard>
      </div>
    );
  }

  const { data: allMemberships = [] } = useQuery({
    queryKey: ['allMemberships', selectedGym?.id],
    queryFn: () => base44.entities.GymMembership.filter({ gym_id: selectedGym.id, status: 'active' }),
    enabled: !!currentUser && !!selectedGym,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  React.useEffect(() => {
    if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]);
  }, [approvedGyms, selectedGym]);

  React.useEffect(() => {
    if (selectedGym?.language && i18n.language !== selectedGym.language) i18n.changeLanguage(selectedGym.language);
  }, [selectedGym, i18n]);

  const { data: checkIns = [] } = useQuery({ queryKey: ['checkIns', selectedGym?.id], queryFn: () => base44.entities.CheckIn.filter({ gym_id: selectedGym.id }, '-check_in_date', 500), enabled: !!selectedGym, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: lifts = [] } = useQuery({ queryKey: ['lifts', selectedGym?.id], queryFn: () => base44.entities.Lift.filter({ gym_id: selectedGym.id }, '-lift_date', 200), enabled: !!selectedGym, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: rewards = [] } = useQuery({ queryKey: ['rewards', selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }), enabled: !!selectedGym, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: classes = [] } = useQuery({ queryKey: ['classes', selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }), enabled: !!selectedGym, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }), enabled: !!selectedGym, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: events = [] } = useQuery({ queryKey: ['events', selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date'), enabled: !!selectedGym, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: posts = [] } = useQuery({ queryKey: ['posts', selectedGym?.id], queryFn: () => base44.entities.Post.filter({ allow_gym_repost: true }, '-created_date', 20), enabled: !!selectedGym, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date'), enabled: !!selectedGym, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: polls = [] } = useQuery({ queryKey: ['polls', selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: !!selectedGym, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });

  const createRewardMutation = useMutation({ mutationFn: (d) => base44.entities.Reward.create(d), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards', selectedGym?.id] }) });
  const deleteRewardMutation = useMutation({ mutationFn: (id) => base44.entities.Reward.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards', selectedGym?.id] }) });
  const createClassMutation = useMutation({ mutationFn: (d) => base44.entities.GymClass.create(d), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes', selectedGym?.id] }) });
  const deleteClassMutation = useMutation({ mutationFn: (id) => base44.entities.GymClass.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes', selectedGym?.id] }) });
  const updateClassMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.GymClass.update(id, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes', selectedGym?.id] }) });
  const createCoachMutation = useMutation({ mutationFn: (d) => base44.entities.Coach.create(d), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] }) });
  const deleteCoachMutation = useMutation({ mutationFn: (id) => base44.entities.Coach.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coaches', selectedGym?.id] }) });
  const updateGalleryMutation = useMutation({ mutationFn: (gallery) => base44.entities.Gym.update(selectedGym.id, { gallery }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); setShowManagePhotos(false); } });
  const updateGymMutation = useMutation({ mutationFn: (data) => base44.entities.Gym.update(selectedGym.id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); setShowManageEquipment(false); setShowManageAmenities(false); setShowEditBasicInfo(false); } });
  const createEventMutation = useMutation({ mutationFn: (d) => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', selectedGym.id] }); setShowCreateEvent(false); } });
  const createChallengeMutation = useMutation({ mutationFn: (d) => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', selectedGym.id] }); setShowCreateChallenge(false); } });
  const banMemberMutation = useMutation({ mutationFn: (userId) => base44.entities.Gym.update(selectedGym.id, { banned_members: [...(selectedGym?.banned_members || []), userId] }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gyms'] }) });
  const unbanMemberMutation = useMutation({ mutationFn: (userId) => base44.entities.Gym.update(selectedGym.id, { banned_members: (selectedGym?.banned_members || []).filter(id => id !== userId) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gyms'] }) });
  const deleteGymMutation = useMutation({ mutationFn: () => base44.entities.Gym.delete(selectedGym.id), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); setShowDeleteConfirm(false); window.location.href = createPageUrl('Gyms'); } });
  const deleteAccountMutation = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => { setShowDeleteAccountConfirm(false); base44.auth.logout(); } });
  const createPollMutation = useMutation({ mutationFn: (d) => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls', selectedGym.id] }); setShowCreatePoll(false); } });

  React.useEffect(() => {
    const interval = setInterval(() => queryClient.invalidateQueries({ queryKey: ['ownerGyms'] }), 10000);
    return () => clearInterval(interval);
  }, [queryClient]);

  if (approvedGyms.length === 0 && pendingGyms.length > 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <GlassCard className="p-10 text-center max-w-md border-yellow-500/20">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Pending Approval</h2>
          <p className="text-slate-400 mb-6">Your gym <span className="font-bold text-yellow-400">{pendingGyms[0].name}</span> is under review. You'll get access once approved.</p>
          <Link to={createPageUrl('Home')}><Button className="bg-slate-700 hover:bg-slate-600 text-white">Back to Home</Button></Link>
        </GlassCard>
      </div>
    );
  }

  if (myGyms.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <GlassCard className="p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
            <Dumbbell className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">No Gyms Registered</h2>
          <p className="text-slate-400 mb-6">Register your gym to start managing it</p>
          <Link to={createPageUrl('GymSignup')}><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">Register Your Gym</Button></Link>
        </GlassCard>
      </div>
    );
  }

  // ── Stats calculation ──────────────────────────────────────────────────────
  const allCheckIns = checkIns;
  const uniqueMembers = new Set(checkIns.map(c => c.user_id)).size;
  const last7Days = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() })).length;
  const last30Days = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).length;
  const todayCheckIns = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(new Date()).getTime()).length;
  const activeMembersThisWeek = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() })).map(c => c.user_id)).size;
  const activeMembersLastWeek = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 14), end: subDays(new Date(), 7) })).map(c => c.user_id)).size;
  const weeklyChange = activeMembersThisWeek - activeMembersLastWeek;
  const weeklyChangePercent = activeMembersLastWeek > 0 ? Math.round((weeklyChange / activeMembersLastWeek) * 100) : 0;
  const gymMemberships = allMemberships;
  const atRiskMembers = gymMemberships.filter(membership => {
    const memberCheckIns = checkIns.filter(c => c.user_id === membership.user_id);
    if (memberCheckIns.length === 0) return false;
    const daysSince = Math.floor((new Date() - new Date(memberCheckIns[0].check_in_date)) / 86400000);
    return daysSince >= 7 && daysSince <= 10;
  }).length;

  const retentionRate = uniqueMembers > 0 ? Math.round((new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).map(c => c.user_id)).size / uniqueMembers) * 100) : 0;

  // ── Chart data ─────────────────────────────────────────────────────────────
  const checkInsByDay = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return { day: format(date, 'EEE'), checkIns: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(date).getTime()).length };
  });

  const weeklyTrendData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = subDays(new Date(), (11 - i) * 7);
    const weekEnd = subDays(new Date(), (10 - i) * 7);
    return { week: format(weekStart, 'MMM d'), checkIns: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: weekStart, end: weekEnd })).length };
  });

  const monthlyMembersData = Array.from({ length: 6 }, (_, i) => {
    const end = subDays(new Date(), i * 30);
    const start = subDays(end, 30);
    return { month: format(end, 'MMM'), members: new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start, end })).map(c => c.user_id)).size };
  }).reverse();

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      {/* Background subtle grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.03) 0%, transparent 50%)' }} />

      <div className="relative max-w-[1440px] mx-auto px-4 md:px-8 py-6 md:py-10">

        {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{selectedGym?.name || 'Dashboard'}</h1>
                {selectedGym?.verified && (
                  <span className="flex items-center gap-1 text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-0.5">{t('dashboard.subtitle')}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Gym selector */}
            {approvedGyms.length > 1 && approvedGyms.map(gym => (
              <button key={gym.id} onClick={() => setSelectedGym(gym)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${selectedGym?.id === gym.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'}`}>
                {gym.name}
              </button>
            ))}
            <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-all">
                <Eye className="w-4 h-4" /> View Gym
              </button>
            </Link>
            <Link to={createPageUrl('Home')}>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-all">
                <Users className="w-4 h-4" /> Member View
              </button>
            </Link>
            <button onClick={() => base44.auth.logout()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all">
              Log out
            </button>
          </div>
        </div>

        {/* ── PRO UPGRADE BANNER ─────────────────────────────────────────────── */}
        <Link to={createPageUrl('Plus')}>
          <div className="flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-slate-800/40 to-pink-900/30 border border-purple-500/25 hover:border-purple-500/40 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">Retention Pro</span>
                <span className="text-xs text-slate-400 ml-2">Advanced analytics, automated messaging & more</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-400 group-hover:text-purple-300 flex items-center gap-1 transition-colors">
              From £49.99/mo <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        {/* ── JOIN CODE STRIP ─────────────────────────────────────────────────── */}
        {selectedGym?.join_code ? (
          <div className="flex flex-wrap items-center gap-4 p-4 mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/25">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wide mb-0.5">Gym Join Code</p>
                <p className="text-2xl font-black text-white tracking-widest">{selectedGym.join_code}</p>
              </div>
            </div>
            <button onClick={() => setShowQRCodeModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition-all shadow">
              <div id="qr-code-container" className="w-8 h-8"><QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym.join_code}`} size={32} level="H" /></div>
              QR Code
            </button>
            <button onClick={() => {
              const svg = document.getElementById('qr-code-container').querySelector('svg');
              const svgData = new XMLSerializer().serializeToString(svg);
              const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
              img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); const a = document.createElement('a'); a.download = `${selectedGym.name}-QR.png`; a.href = canvas.toDataURL('image/png'); a.click(); };
              img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            }} className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all">
              <Download className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 mb-6 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-sm text-slate-400">No join code generated yet</p>
            <button onClick={async () => {
              try {
                const res = await base44.functions.invoke('generateGymJoinCode', { gym_id: selectedGym.id });
                if (res.data?.success) queryClient.invalidateQueries({ queryKey: ['gyms'] });
                else alert(res.data?.error || 'Failed to generate join code.');
              } catch { alert('Failed to generate join code.'); }
            }} className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all">
              Generate Code
            </button>
          </div>
        )}

        {/* ── AT-RISK ALERT ───────────────────────────────────────────────────── */}
        {atRiskMembers > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 mb-6 rounded-2xl bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/30">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-sm">⚠️ {atRiskMembers} members at risk</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('dashboard.membersHaventCheckedIn', { count: atRiskMembers })}</p>
            </div>
            <button onClick={() => setShowManageMembers(true)} className="px-4 py-2 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm font-semibold hover:bg-orange-500/30 transition-all whitespace-nowrap">
              View Members
            </button>
          </div>
        )}

        {/* ── KPI CARDS ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10 border border-blue-500/20" label="Active Members" value={uniqueMembers} sub="all-time unique" />
          <StatCard icon={Activity} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border border-emerald-500/20" label="Check-ins (30d)" value={last30Days} sub={`${last7Days} this week`} trend={weeklyChangePercent} trendValue={weeklyChangePercent} />
          <StatCard icon={Zap} iconColor="text-orange-400" iconBg="bg-orange-500/10 border border-orange-500/20" label="Active This Week" value={activeMembersThisWeek} sub={`${weeklyChange >= 0 ? '+' : ''}${weeklyChange} vs last week`} />
          <StatCard icon={Star} iconColor="text-amber-400" iconBg="bg-amber-500/10 border border-amber-500/20" label="Avg Rating" value={selectedGym?.rating?.toFixed(1) ?? '—'} sub="out of 5.0" />
        </div>

        {/* ── QUICK ACTIONS ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <ActionButton icon={() => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>} label="Scan QR" onClick={() => setShowQRScanner(true)} gradient="bg-gradient-to-br from-emerald-700/40 to-teal-700/40" border="border-emerald-500/30 hover:border-emerald-400/50" />
          <ActionButton icon={Users} label="Members" sub={`${uniqueMembers}`} onClick={() => setShowManageMembers(true)} gradient="bg-slate-800/60" border="border-slate-700/60 hover:border-slate-600" />
          <ActionButton icon={Calendar} label="Classes" sub={`${classes.length}`} onClick={() => setShowManageClasses(true)} gradient="bg-slate-800/60" border="border-slate-700/60 hover:border-slate-600" />
          <ActionButton icon={Target} label="Coaches" sub={`${coaches.length}`} onClick={() => setShowManageCoaches(true)} gradient="bg-slate-800/60" border="border-slate-700/60 hover:border-slate-600" />
          <ActionButton icon={Gift} label="Rewards" sub={`${rewards.length}`} onClick={() => setShowManageRewards(true)} gradient="bg-slate-800/60" border="border-slate-700/60 hover:border-slate-600" />
          <ActionButton icon={() => <span className="text-xl">📊</span>} label="Polls" sub={`${polls.length}`} onClick={() => setShowCreatePoll(true)} gradient="bg-slate-800/60" border="border-slate-700/60 hover:border-slate-600" />
        </div>

        {/* ── VIEW GYM ────────────────────────────────────────────────────────── */}
        <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
          <div className="flex items-center justify-between p-4 mb-8 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/25 hover:border-blue-500/40 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white">View My Gym Community</p>
                <p className="text-xs text-slate-400">Manage posts, events & community</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* ── TABS ────────────────────────────────────────────────────────────── */}
        <Tabs defaultValue="snapshot" className="w-full">
          <div className="overflow-x-auto pb-1 mb-6">
            <TabsList className="flex gap-1 bg-slate-800/60 border border-slate-700/60 p-1 rounded-2xl w-max min-w-full md:w-full backdrop-blur-sm">
              {[
                { value: 'snapshot', label: 'Snapshot', emoji: '📊' },
                { value: 'engagement', label: 'Engagement', emoji: '🔥' },
                { value: 'content', label: 'Content', emoji: '📸' },
                { value: 'insights', label: 'Insights', emoji: '📈' },
                { value: 'admin', label: 'Admin', emoji: '⚙️' },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex-1 rounded-xl px-3 py-2.5 text-xs md:text-sm font-semibold text-slate-400 data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                  {tab.emoji} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ─── SNAPSHOT ──────────────────────────────────────────────────────── */}
          <TabsContent value="snapshot" className="space-y-6">
            {/* Today's snapshot row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Today', value: todayCheckIns, sub: 'check-ins', color: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', text: 'text-blue-400' },
                { label: 'This Week', value: activeMembersThisWeek, sub: 'unique members', color: 'from-emerald-500/20 to-emerald-600/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
                { label: 'Weekly Δ', value: `${weeklyChange >= 0 ? '+' : ''}${weeklyChange}`, sub: `${weeklyChangePercent >= 0 ? '+' : ''}${weeklyChangePercent}% vs last wk`, color: 'from-violet-500/20 to-violet-600/20', border: 'border-violet-500/30', text: 'text-violet-400' },
                { label: 'At Risk', value: atRiskMembers, sub: '7–10 days inactive', color: 'from-red-500/20 to-red-600/20', border: 'border-red-500/30', text: 'text-red-400' },
              ].map((item, i) => (
                <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${item.color} border ${item.border}`}>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">{item.label}</p>
                  <p className={`text-4xl font-black ${item.text} mb-1`}>{item.value}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Check-in bar chart */}
            <GlassCard className="p-6">
              <SectionHeader icon="📆" title="Last 7 Days" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={checkInsByDay} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
                  <Bar dataKey="checkIns" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Check-ins" />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Action items + Activity log side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Action Items */}
              <GlassCard className="p-6">
                <SectionHeader icon="💡" title={t('dashboard.whatToDoNext')} />
                <div className="space-y-3">
                  {atRiskMembers > 0 ? (
                    <div className="flex gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <span className="text-xl flex-shrink-0">⚠️</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{t('dashboard.reachOutAtRisk')}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t('dashboard.membersHaventCheckedIn', { count: atRiskMembers })}</p>
                        <button onClick={() => setShowManageMembers(true)} className="mt-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors">View →</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xl flex-shrink-0">✅</span>
                      <p className="text-sm text-slate-300 font-medium">No at-risk members right now — great work!</p>
                    </div>
                  )}
                  {posts.length < 3 && (
                    <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <span className="text-xl flex-shrink-0">📸</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{t('dashboard.shareGymUpdates')}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t('dashboard.keepMembersEngaged')}</p>
                        <button onClick={() => setShowCreatePost(true)} className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Create Post →</button>
                      </div>
                    </div>
                  )}
                  {challenges.filter(c => c.status === 'active').length === 0 && (
                    <div className="flex gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xl flex-shrink-0">🏆</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{t('dashboard.createChallenge')}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{t('dashboard.boostEngagement')}</p>
                        <button onClick={() => setShowCreateChallenge(true)} className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Create Challenge →</button>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Recent Activity */}
              <GlassCard className="p-6">
                <SectionHeader icon="⚡" title={t('dashboard.activityLog')} />
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scroll">
                  {checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() })).slice(0, 15).map((c, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-700/40 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.user_name}</p>
                        <p className="text-xs text-slate-500">checked in</p>
                      </div>
                      <p className="text-xs text-slate-500 flex-shrink-0">{format(new Date(c.check_in_date), 'MMM d, h:mma')}</p>
                    </div>
                  ))}
                  {checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() })).length === 0 && (
                    <div className="text-center py-10">
                      <Activity className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                      <p className="text-slate-500 text-sm">No activity in the last 7 days</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* ─── ENGAGEMENT ────────────────────────────────────────────────────── */}
          <TabsContent value="engagement" className="space-y-6">
            {/* Overview numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: uniqueMembers, color: 'text-blue-400' },
                { label: 'Active (7d)', value: activeMembersThisWeek, color: 'text-emerald-400' },
                { label: 'Total Check-ins', value: checkIns.length, color: 'text-purple-400' },
                { label: 'PRs Logged', value: lifts.filter(l => l.is_pr).length, color: 'text-orange-400' },
              ].map((s, i) => (
                <GlassCard key={i} className="p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
                  <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
                </GlassCard>
              ))}
            </div>

            {/* Engagement breakdown */}
            <GlassCard className="p-6">
              <SectionHeader icon="🎯" title="Engagement Levels" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const monthCheckIns = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() }));
                  const counts = monthCheckIns.reduce((acc, c) => { acc[c.user_id] = (acc[c.user_id] || 0) + 1; return acc; }, {});
                  const vals = Object.values(counts);
                  return [
                    { label: 'Super Active', sub: '15+ visits/mo', val: vals.filter(v => v >= 15).length, bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', emoji: '🔥' },
                    { label: 'Active', sub: '8–14 visits/mo', val: vals.filter(v => v >= 8 && v < 15).length, bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', text: 'text-blue-400', emoji: '💪' },
                    { label: 'Casual', sub: '1–7 visits/mo', val: vals.filter(v => v >= 1 && v < 8).length, bg: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', emoji: '🚶' },
                    { label: 'At Risk', sub: '7–10d inactive', val: atRiskMembers, bg: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/30', text: 'text-red-400', emoji: '⚠️' },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${item.bg} border ${item.border}`}>
                      <div className="text-2xl mb-2">{item.emoji}</div>
                      <p className={`text-3xl font-black ${item.text} mb-1`}>{item.val}</p>
                      <p className="text-sm font-bold text-slate-300">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                  ));
                })()}
              </div>
            </GlassCard>

            {/* Retention + Day analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader icon="📌" title="Retention" />
                <div className="space-y-3">
                  {[
                    { label: 'Active This Month', val: new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).map(c => c.user_id)).size, sub: `out of ${uniqueMembers} total`, color: 'text-emerald-400' },
                    { label: 'Inactive 30+ Days', val: (() => { const active = new Set(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() })).map(c => c.user_id)); return new Set(checkIns.map(c => c.user_id)).size - active.size; })(), sub: 'consider reaching out', color: 'text-orange-400' },
                    { label: 'Retention Rate', val: `${retentionRate}%`, sub: '30-day active rate', color: 'text-blue-400' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-700/30 border border-slate-700/40">
                      <div>
                        <p className="text-sm font-bold text-white">{r.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.sub}</p>
                      </div>
                      <p className={`text-2xl font-black ${r.color}`}>{r.val}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader icon="📅" title={t('dashboard.dayOfWeekAnalysis')} />
                <div className="space-y-2">
                  {(() => {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const dayData = {};
                    checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); dayData[d] = (dayData[d] || 0) + 1; });
                    const max = Math.max(...Object.values(dayData), 1);
                    return days.map((name, idx) => ({ name, count: dayData[idx] || 0 }))
                      .sort((a, b) => b.count - a.count)
                      .map(({ name, count }, rank) => (
                        <div key={name} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500 w-4">#{rank + 1}</span>
                          <span className="text-sm text-slate-300 w-24 flex-shrink-0">{name}</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right">{count}</span>
                        </div>
                      ));
                  })()}
                </div>
              </GlassCard>
            </div>

            {/* New vs Returning */}
            <GlassCard className="p-6">
              <SectionHeader icon="🔄" title={t('dashboard.newVsReturning')} />
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'First-Time', val: checkIns.filter(c => c.first_visit).length, sub: 'new members', color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
                  { label: 'Returning', val: checkIns.filter(c => !c.first_visit).length, sub: 'loyal members', color: 'text-blue-400', border: 'border-blue-500/25', bg: 'bg-blue-500/10' },
                  { label: 'Return Rate', val: `${checkIns.length > 0 ? Math.round((checkIns.filter(c => !c.first_visit).length / checkIns.length) * 100) : 0}%`, sub: '% returning visits', color: 'text-purple-400', border: 'border-purple-500/25', bg: 'bg-purple-500/10' },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-xl ${item.bg} border ${item.border} text-center`}>
                    <p className={`text-3xl font-black ${item.color} mb-1`}>{item.val}</p>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Avg visit stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'All-Time Avg', val: uniqueMembers > 0 ? (checkIns.length / uniqueMembers).toFixed(1) : 0, sub: 'visits/member', color: 'text-purple-400' },
                { label: '30d Avg', val: uniqueMembers > 0 ? (last30Days / uniqueMembers).toFixed(1) : 0, sub: 'visits/member (30d)', color: 'text-blue-400' },
                { label: '7d Avg', val: activeMembersThisWeek > 0 ? (last7Days / activeMembersThisWeek).toFixed(1) : 0, sub: 'visits/active member', color: 'text-emerald-400' },
              ].map((s, i) => (
                <GlassCard key={i} className="p-5 text-center">
                  <p className={`text-4xl font-black ${s.color} mb-1`}>{s.val}</p>
                  <p className="text-sm font-bold text-white">{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
                </GlassCard>
              ))}
            </div>

            {/* Weekly Leaderboard */}
            <GlassCard className="p-6">
              <SectionHeader icon="🏆" title={t('dashboard.weeklyLeaderboard')} />
              <p className="text-xs text-slate-500 mb-4 -mt-3">{t('dashboard.topMembersThisWeek')}</p>
              <div className="space-y-2">
                {Object.entries(checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() })).reduce((acc, c) => { acc[c.user_name] = (acc[c.user_name] || 0) + 1; return acc; }, {}))
                  .sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, count], idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const isTop3 = idx < 3;
                    return (
                      <Link key={name} to={createPageUrl('Leaderboard')}>
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] ${isTop3 ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/25' : 'bg-slate-700/30 border-slate-700/40 hover:border-slate-600'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isTop3 ? 'bg-amber-500/20' : 'bg-slate-600'}`}>
                            {isTop3 ? medals[idx] : <span className="text-slate-400 text-xs">{idx + 1}</span>}
                          </div>
                          <span className="flex-1 font-semibold text-white text-sm">{name}</span>
                          <span className="text-xs font-bold bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg">{count} visits</span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </GlassCard>
          </TabsContent>

          {/* ─── CONTENT ───────────────────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Create Event', sub: `${events.length} events`, onClick: () => setShowCreateEvent(true), bg: 'from-blue-700/30 to-cyan-700/30', border: 'border-blue-500/30', icon: Calendar },
                { label: 'Create Challenge', sub: `${challenges.length} challenges`, onClick: () => setShowCreateChallenge(true), bg: 'from-orange-700/30 to-red-700/30', border: 'border-orange-500/30', icon: Trophy },
                { label: 'Create Poll', sub: `${polls.length} polls`, onClick: () => setShowCreatePoll(true), bg: 'from-purple-700/30 to-pink-700/30', border: 'border-purple-500/30', icon: BarChart2 },
              ].map((b, i) => (
                <button key={i} onClick={b.onClick} className={`group flex flex-col items-center justify-center gap-2 p-6 rounded-2xl bg-gradient-to-br ${b.bg} border ${b.border} hover:brightness-110 transition-all`}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><b.icon className="w-5 h-5 text-white" /></div>
                  <span className="font-bold text-white text-sm">{b.label}</span>
                  <span className="text-xs text-white/50">{b.sub}</span>
                </button>
              ))}
            </div>

            {/* Events */}
            <GlassCard className="p-6">
              <SectionHeader icon="📅" title="Upcoming Events" badge={events.filter(e => new Date(e.event_date) >= new Date()).length} action={() => setShowCreateEvent(true)} actionLabel="New Event" />
              {events.filter(e => new Date(e.event_date) >= new Date()).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 6).map(event => (
                    <div key={event.id} className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/35 transition-all">
                      {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-36 object-cover rounded-xl mb-3" />}
                      <h5 className="font-bold text-white mb-1">{event.title}</h5>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>📅 {format(new Date(event.event_date), 'MMM d, h:mma')}</span>
                        <span>👥 {event.attendees || 0} attending</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><Calendar className="w-12 h-12 mx-auto text-slate-700 mb-2" /><p className="text-slate-500 text-sm">No upcoming events</p></div>
              )}
            </GlassCard>

            {/* Challenges */}
            <GlassCard className="p-6">
              <SectionHeader icon="🏆" title="Active Challenges" badge={challenges.filter(c => c.status === 'active').length} action={() => setShowCreateChallenge(true)} actionLabel="New Challenge" />
              {challenges.filter(c => c.status === 'active').length > 0 ? (
                <div className="space-y-3">
                  {challenges.filter(c => c.status === 'active').map(challenge => (
                    <div key={challenge.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/35 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h5 className="font-bold text-white text-sm">🏆 {challenge.title}</h5>
                          <Badge className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30 px-2">{challenge.type?.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{challenge.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                          <span>👥 {challenge.participants?.length || 0} participants</span>
                          <span>📅 {format(new Date(challenge.start_date), 'MMM d')} – {format(new Date(challenge.end_date), 'MMM d')}</span>
                          {challenge.reward && <span>🎁 {challenge.reward}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><Trophy className="w-12 h-12 mx-auto text-slate-700 mb-2" /><p className="text-slate-500 text-sm">No active challenges</p></div>
              )}
            </GlassCard>

            {/* Polls */}
            {polls.length > 0 && (
              <GlassCard className="p-6">
                <SectionHeader icon="📊" title="Active Polls" badge={polls.length} action={() => setShowCreatePoll(true)} actionLabel="New Poll" />
                <div className="space-y-3">
                  {polls.slice(0, 4).map(poll => (
                    <div key={poll.id} className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/35 transition-all">
                      <h5 className="font-bold text-white text-sm mb-1">{poll.title}</h5>
                      <p className="text-xs text-slate-400 mb-2 line-clamp-1">{poll.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>📊 {poll.voters?.length || 0} votes</span>
                        <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30 px-2">{poll.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Posts / Feed */}
            <GlassCard className="p-6">
              <SectionHeader icon="📸" title="Gym Feed" action={() => setShowCreatePost(true)} actionLabel="New Post" />
              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.slice(0, 8).map(post => (
                    <div key={post.id} className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/40 hover:border-slate-600/60 transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">{post.member_name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-semibold text-white">{post.member_name}</p>
                          <p className="text-xs text-slate-500">{format(new Date(post.created_date), 'MMM d, h:mma')}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 mb-2">{post.content}</p>
                      {post.image_url && <img src={post.image_url} alt="Post" className="w-full rounded-lg h-36 object-cover mb-2" />}
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>❤️ {post.likes || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><Activity className="w-12 h-12 mx-auto text-slate-700 mb-2" /><p className="text-slate-500 text-sm">No posts yet — create one to engage your members</p></div>
              )}
            </GlassCard>

            {/* Rewards */}
            <GlassCard className="p-6">
              <SectionHeader icon="🎁" title="Rewards Program" badge={rewards.length} action={() => setShowManageRewards(true)} actionLabel="Manage" />
              {rewards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.slice(0, 6).map(reward => (
                    <div key={reward.id} className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/35 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{reward.icon || '🎁'}</span>
                        <Badge className={`text-xs px-2 ${reward.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-600 text-slate-400 border-slate-500'}`}>{reward.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">{reward.title}</h4>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{reward.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300 font-bold">{reward.value}</span>
                        <span className="text-slate-500">{reward.claimed_by?.length || 0} claimed</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><Gift className="w-12 h-12 mx-auto text-slate-700 mb-2" /><p className="text-slate-500 text-sm">No rewards yet — create one to boost engagement</p></div>
              )}
            </GlassCard>
          </TabsContent>

          {/* ─── INSIGHTS ──────────────────────────────────────────────────────── */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const l7 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 7), end: new Date() }));
                const l30 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 30), end: new Date() }));
                const prev30 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(new Date(), 60), end: subDays(new Date(), 30) }));
                const changeVal = prev30.length > 0 ? (((l30.length - prev30.length) / prev30.length) * 100).toFixed(0) : 0;
                return [
                  { label: 'Last 7 Days', val: l7.length, sub: 'check-ins', color: 'text-blue-400' },
                  { label: 'Last 30 Days', val: l30.length, sub: 'check-ins', color: 'text-emerald-400' },
                  { label: 'Daily Avg', val: Math.round(l30.length / 30), sub: 'check-ins/day', color: 'text-purple-400' },
                  { label: 'vs Prev. Month', val: `${changeVal >= 0 ? '+' : ''}${changeVal}%`, sub: 'change', color: changeVal >= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map((s, i) => (
                  <GlassCard key={i} className="p-5">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{s.label}</p>
                    <p className={`text-3xl font-black ${s.color} mb-1`}>{s.val}</p>
                    <p className="text-xs text-slate-500">{s.sub}</p>
                  </GlassCard>
                ));
              })()}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <SectionHeader icon="📈" title="Weekly Check-in Trend" />
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weeklyTrendData}>
                    <defs>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="checkIns" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" name="Check-ins" />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader icon="👥" title="Active Members Growth" />
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyMembersData}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="members" stroke="#10b981" strokeWidth={2} fill="url(#greenGrad)" name="Members" />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader icon="🎁" title="Rewards Redeemed" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={(() => {
                    return rewards.filter(r => (r.claimed_by?.length || 0) > 0).sort((a, b) => (b.claimed_by?.length || 0) - (a.claimed_by?.length || 0)).slice(0, 5)
                      .map(r => ({ reward: r.title.length > 12 ? r.title.substring(0, 12) + '…' : r.title, claims: r.claimed_by?.length || 0 }));
                  })()} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="reward" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                    <Bar dataKey="claims" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Claims" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-6">
                <SectionHeader icon="⏱️" title={t('dashboard.peakHoursAnalysis')} />
                <div className="space-y-2 overflow-y-auto max-h-52">
                  {(() => {
                    const hourlyData = {};
                    checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourlyData[h] = (hourlyData[h] || 0) + 1; });
                    const max = Math.max(...Object.values(hourlyData), 1);
                    return Object.entries(hourlyData).sort(([, a], [, b]) => b - a).slice(0, 8).map(([hour, count], i) => {
                      const h = parseInt(hour);
                      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                      return (
                        <div key={hour} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-4">#{i + 1}</span>
                          <span className="text-sm text-slate-300 w-14 flex-shrink-0">{label}</span>
                          <div className="flex-1 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${(count / max) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold text-white w-7 text-right">{count}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </GlassCard>
            </div>
          </TabsContent>

          {/* ─── ADMIN ──────────────────────────────────────────────────────────── */}
          <TabsContent value="admin" className="space-y-6">
            {/* Gym Profile */}
            <GlassCard className="p-6">
              <SectionHeader icon="🏋️" title={t('dashboard.gymProfileSetup')} />

              {/* Basic info */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/40 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-200 text-sm">{t('dashboard.basicInformation')}</h4>
                  <button onClick={() => setShowEditBasicInfo(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Gym Name', val: selectedGym?.name },
                    { label: 'Type', val: selectedGym?.type },
                    { label: 'Location', val: `${selectedGym?.city}` },
                    { label: 'Monthly Price', val: `£${selectedGym?.price}/mo` },
                  ].map((f, i) => (
                    <div key={i}>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{f.label}</p>
                      <p className="text-sm font-semibold text-white">{f.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manage cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: t('dashboard.manageClasses'), sub: `${classes.length} classes`, icon: Calendar, onClick: () => setShowManageClasses(true) },
                  { label: t('dashboard.manageCoaches'), sub: `${coaches.length} coaches`, icon: Target, onClick: () => setShowManageCoaches(true) },
                  { label: t('dashboard.viewMembersBtn'), sub: `${uniqueMembers} members`, icon: Users, onClick: () => setShowManageMembers(true) },
                ].map((b, i) => (
                  <button key={i} onClick={b.onClick} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-700/30 border border-slate-700/40 hover:border-slate-600 hover:bg-slate-700/50 transition-all">
                    <b.icon className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold text-white">{b.label}</span>
                    <span className="text-xs text-slate-500">{b.sub}</span>
                  </button>
                ))}
              </div>

              {/* Amenities & Equipment */}
              {[
                { title: 'Amenities', items: selectedGym?.amenities, onEdit: () => setShowManageAmenities(true), itemClass: 'bg-slate-700/50 text-slate-300 border-slate-600' },
                { title: 'Equipment', items: selectedGym?.equipment, onEdit: () => setShowManageEquipment(true), itemClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30', limit: 15 },
              ].map((section, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/40 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-200 text-sm">{section.title}</h4>
                    <button onClick={section.onEdit} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(section.limit ? section.items?.slice(0, section.limit) : section.items)?.map((item, idx) => (
                      <span key={idx} className={`text-xs px-2.5 py-1 rounded-lg border ${section.itemClass}`}>{item}</span>
                    ))}
                    {section.limit && section.items?.length > section.limit && <span className="text-xs px-2.5 py-1 rounded-lg border bg-slate-700/50 text-slate-400 border-slate-600">+{section.items.length - section.limit} more</span>}
                  </div>
                </div>
              ))}

              {/* Gallery */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-200 text-sm">Photo Gallery</h4>
                  <button onClick={() => setShowManagePhotos(true)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-all">
                    <ImageIcon className="w-3 h-3" /> Manage
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedGym?.gallery?.slice(0, 8).map((url, idx) => (
                    <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-full h-20 object-cover rounded-lg border border-slate-700" />
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Admin Info */}
            <GlassCard className="p-6">
              <SectionHeader icon="🔐" title="Admin Access" />
              <div className="space-y-3">
                {[
                  { label: 'Owner Email', val: selectedGym?.owner_email },
                  { label: 'Gym ID', val: selectedGym?.id, mono: true },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 border border-slate-700/40">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{f.label}</p>
                    <p className={`text-sm font-semibold text-white ${f.mono ? 'font-mono text-xs' : ''}`}>{f.val}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 border border-slate-700/40">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <Badge className={`text-xs ${selectedGym?.verified ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-600 text-slate-400 border-slate-500'}`}>
                    {selectedGym?.verified ? '✓ Verified' : 'Not Verified'}
                  </Badge>
                </div>
                <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
                  <button className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-sm font-semibold transition-all">
                    View Public Gym Page →
                  </button>
                </Link>
              </div>
            </GlassCard>

            {/* Danger Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard className="p-5 border-red-900/40">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <h4 className="font-bold text-white text-sm">Delete Gym</h4>
                </div>
                <p className="text-xs text-slate-400 mb-4">Permanently delete this gym and all associated data. Cannot be undone.</p>
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-sm font-bold transition-all border border-red-500/50">
                  Delete Gym
                </button>
              </GlassCard>
              <GlassCard className="p-5 border-red-900/50">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-white text-sm">Delete Account</h4>
                </div>
                <p className="text-xs text-slate-400 mb-4">Permanently delete your account and all personal data. Cannot be undone.</p>
                <button onClick={() => setShowDeleteAccountConfirm(true)} className="w-full py-2.5 rounded-xl bg-red-800/80 hover:bg-red-700 text-white text-sm font-bold transition-all border border-red-600/50">
                  Delete My Account
                </button>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────────────── */}
      <ManageRewardsModal open={showManageRewards} onClose={() => setShowManageRewards(false)} rewards={rewards} onCreateReward={(d) => createRewardMutation.mutate(d)} onDeleteReward={(id) => deleteRewardMutation.mutate(id)} gym={selectedGym} isLoading={createRewardMutation.isPending} />
      <ManageClassesModal open={showManageClasses} onClose={() => setShowManageClasses(false)} classes={classes} onCreateClass={(d) => createClassMutation.mutate(d)} onUpdateClass={(id, d) => updateClassMutation.mutate({ id, d })} onDeleteClass={(id) => deleteClassMutation.mutate(id)} gym={selectedGym} isLoading={createClassMutation.isPending || updateClassMutation.isPending} />
      <ManageCoachesModal open={showManageCoaches} onClose={() => setShowManageCoaches(false)} coaches={coaches} onCreateCoach={(d) => createCoachMutation.mutate(d)} onDeleteCoach={(id) => deleteCoachMutation.mutate(id)} gym={selectedGym} isLoading={createCoachMutation.isPending} />
      <ManageGymPhotosModal open={showManagePhotos} onClose={() => setShowManagePhotos(false)} gallery={selectedGym?.gallery || []} onSave={(gallery) => updateGalleryMutation.mutate(gallery)} isLoading={updateGalleryMutation.isPending} />
      <ManageMembersModal open={showManageMembers} onClose={() => setShowManageMembers(false)} gym={selectedGym} onBanMember={(id) => banMemberMutation.mutate(id)} onUnbanMember={(id) => unbanMemberMutation.mutate(id)} />
      <CreateGymOwnerPostModal open={showCreatePost} onClose={() => setShowCreatePost(false)} gym={selectedGym} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['posts', selectedGym?.id] })} />
      <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSave={(d) => createEventMutation.mutate(d)} gym={selectedGym} isLoading={createEventMutation.isPending} />
      <CreateChallengeModal open={showCreateChallenge} onClose={() => setShowCreateChallenge(false)} gyms={gyms} onSave={(d) => createChallengeMutation.mutate(d)} isLoading={createChallengeMutation.isPending} />
      <QRScanner open={showQRScanner} onClose={() => setShowQRScanner(false)} />
      <ManageEquipmentModal open={showManageEquipment} onClose={() => setShowManageEquipment(false)} equipment={selectedGym?.equipment || []} onSave={(equipment) => updateGymMutation.mutate({ equipment })} isLoading={updateGymMutation.isPending} />
      <ManageAmenitiesModal open={showManageAmenities} onClose={() => setShowManageAmenities(false)} amenities={selectedGym?.amenities || []} onSave={(amenities) => updateGymMutation.mutate({ amenities })} isLoading={updateGymMutation.isPending} />
      <EditBasicInfoModal open={showEditBasicInfo} onClose={() => setShowEditBasicInfo(false)} gym={selectedGym} onSave={(d) => updateGymMutation.mutate(d)} isLoading={updateGymMutation.isPending} />
      <CreatePollModal open={showCreatePoll} onClose={() => setShowCreatePoll(false)} onSave={(d) => createPollMutation.mutate(d)} isLoading={createPollMutation.isPending} />

      {/* Delete Gym Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-900 border border-red-700/40 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-400" /> Delete Gym Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm">This will permanently delete <span className="font-bold text-white">{selectedGym?.name}</span> and all check-ins, rewards, classes, events, and member data. <span className="text-red-400 font-semibold">This cannot be undone.</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGymMutation.mutate()} disabled={deleteGymMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">{deleteGymMutation.isPending ? 'Deleting…' : 'Delete Permanently'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteAccountConfirm} onOpenChange={setShowDeleteAccountConfirm}>
        <AlertDialogContent className="bg-slate-900 border border-red-700/40 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-500" /> Delete Account Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm">This will permanently delete your account, all your gyms, and associated data. <span className="text-red-400 font-semibold">This cannot be undone.</span></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccountMutation.mutate()} disabled={deleteAccountMutation.isPending} className="bg-red-700 hover:bg-red-800 text-white">{deleteAccountMutation.isPending ? 'Deleting…' : 'Delete Account'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Fullscreen Modal */}
      {showQRCodeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Gym Join QR Code</h3>
              <button onClick={() => setShowQRCodeModal(false)} className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex justify-center p-6 bg-white rounded-2xl mb-6" id="qr-code-fullscreen">
              <QRCode value={`${window.location.origin}${createPageUrl('Gyms')}?joinCode=${selectedGym?.join_code}`} size={280} level="H" />
            </div>
            <p className="text-center text-sm text-slate-400 mb-5">Code: <span className="font-black text-white tracking-widest">{selectedGym?.join_code}</span></p>
            <div className="space-y-2.5">
              <button onClick={() => {
                const svg = document.getElementById('qr-code-fullscreen').querySelector('svg');
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
                img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); const a = document.createElement('a'); a.download = `${selectedGym?.name}-QR.png`; a.href = canvas.toDataURL('image/png'); a.click(); };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
              }} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download QR Code
              </button>
              <button onClick={() => setShowQRCodeModal(false)} className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
