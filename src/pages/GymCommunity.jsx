import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, Calendar, Plus, Edit, GraduationCap, Clock, Target, Award, Image as ImageIcon, Crown, Dumbbell, Flame, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import GymPostCard from '../components/feed/GymPostCard';
import CreateGymPostButton from '../components/feed/CreateGymPostButton';
import LeaderboardCard from '../components/leaderboard/LeaderboardCard';
import EventCard from '../components/events/EventCard';
import CreateEventModal from '../components/events/CreateEventModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import CheckInButton from '../components/gym/CheckInButton';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import LogLiftModal from '../components/lifts/LogLiftModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import UpgradeMembershipModal from '../components/membership/UpgradeMembershipModal';
import JoinGymModal from '../components/membership/JoinGymModal';
import ChallengeProgressCard from '../components/challenges/ChallengeProgressCard';
import WeeklyEventCard from '../components/feed/WeeklyEventCard';
import SystemChallengeCard from '../components/challenges/SystemChallengeCard';
import MiniLeaderboard from '../components/challenges/MiniLeaderboard';

export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showManageEquipment, setShowManageEquipment] = useState(false);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showEditHeroImage, setShowEditHeroImage] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [viewAsMember, setViewAsMember] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showJoinGymModal, setShowJoinGymModal] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      const gyms = await base44.entities.Gym.list();
      return gyms.find(g => g.id === gymId);
    },
    enabled: !!gymId
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date')
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', gymId],
    queryFn: async () => {
      const allCheckIns = await base44.entities.CheckIn.list('-check_in_date');
      return allCheckIns.filter(c => c.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', gymId],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list('-event_date');
      return allEvents.filter(e => e.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', gymId],
    queryFn: async () => {
      const allClasses = await base44.entities.GymClass.list();
      return allClasses.filter(c => c.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches', gymId],
    queryFn: async () => {
      const allCoaches = await base44.entities.Coach.list();
      return allCoaches.filter(c => c.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', gymId],
    queryFn: async () => {
      const allRewards = await base44.entities.Reward.list();
      return allRewards.filter(r => r.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', gymId],
    queryFn: async () => {
      const allChallenges = await base44.entities.Challenge.list();
      return allChallenges.filter(c => c.gym_id === gymId || c.type === 'community');
    },
    enabled: !!gymId
  });

  const { data: gymMembership } = useQuery({
    queryKey: ['gymMembership', currentUser?.id, gymId],
    queryFn: async () => {
      const memberships = await base44.entities.GymMembership.list();
      return memberships.find(m => m.user_id === currentUser.id && m.gym_id === gymId && m.status === 'active');
    },
    enabled: !!currentUser && !!gymId
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.Event.create({
      ...eventData,
      gym_id: gymId,
      gym_name: gym?.name,
      attendees: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gymId] });
      setShowCreateEvent(false);
    }
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, currentAttendees }) => 
      base44.entities.Event.update(eventId, {
        attendees: currentAttendees + 1
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gymId] });
    }
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: (equipment) => base44.entities.Gym.update(gymId, { equipment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      setShowManageEquipment(false);
    }
  });

  const createRewardMutation = useMutation({
    mutationFn: (rewardData) => base44.entities.Reward.create(rewardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', gymId] });
    }
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (rewardId) => base44.entities.Reward.delete(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', gymId] });
    }
  });

  const claimRewardMutation = useMutation({
    mutationFn: ({ rewardId, userId, currentClaimed }) => 
      base44.entities.Reward.update(rewardId, {
        claimed_by: [...currentClaimed, userId]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', gymId] });
    }
  });

  const createClassMutation = useMutation({
    mutationFn: (classData) => base44.entities.GymClass.create(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', gymId] });
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (classId) => base44.entities.GymClass.delete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', gymId] });
    }
  });

  const createCoachMutation = useMutation({
    mutationFn: (coachData) => base44.entities.Coach.create(coachData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
    }
  });

  const deleteCoachMutation = useMutation({
    mutationFn: (coachId) => base44.entities.Coach.delete(coachId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
    }
  });

  const updateCoachMutation = useMutation({
    mutationFn: ({ coachId, data }) => base44.entities.Coach.update(coachId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
    }
  });



  const updateGalleryMutation = useMutation({
    mutationFn: (gallery) => base44.entities.Gym.update(gymId, { gallery }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      setShowManagePhotos(false);
    }
  });

  const updateHeroImageMutation = useMutation({
    mutationFn: (image_url) => base44.entities.Gym.update(gymId, { image_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      setShowEditHeroImage(false);
    }
  });

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id, gymId],
    queryFn: async () => {
      const bonuses = await base44.entities.ClaimedBonus.filter({ user_id: currentUser.id, gym_id: gymId });
      return bonuses;
    },
    enabled: !!currentUser && !!gymId
  });

  const { data: challengeParticipants = [] } = useQuery({
    queryKey: ['challengeParticipants', currentUser?.id],
    queryFn: async () => {
      const participants = await base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id });
      return participants;
    },
    enabled: !!currentUser
  });

  const claimBonusMutation = useMutation({
    mutationFn: ({ bonusType, offerDetails }) =>
      base44.entities.ClaimedBonus.create({
        user_id: currentUser.id,
        gym_id: gymId,
        bonus_type: bonusType,
        offer_details: offerDetails
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses', currentUser?.id, gymId] });
      // Create notification
      base44.entities.Notification.create({
        user_id: currentUser.id,
        type: 'reward',
        title: '🎁 Bonus Claimed!',
        message: 'Your gym bonus has been claimed successfully',
        icon: '🎉'
      });
    }
  });

  const joinChallengeMutation = useMutation({
    mutationFn: (challenge) =>
      base44.entities.ChallengeParticipant.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        challenge_id: challenge.id,
        challenge_title: challenge.title,
        progress: 0,
        completed: false
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants', currentUser?.id] });
      // Create notification
      base44.entities.Notification.create({
        user_id: currentUser.id,
        type: 'challenge',
        title: '💪 Challenge Joined!',
        message: 'Good luck on your new challenge!',
        icon: '🎯'
      });
    }
  });

  const hasClaimedBonus = (bonusType) => {
    return claimedBonuses.some(b => b.bonus_type === bonusType);
  };

  const hasjoinedChallenge = (challengeId) => {
    return challengeParticipants.some(p => p.challenge_id === challengeId);
  };

  const banMemberMutation = useMutation({
    mutationFn: (userId) => {
      const currentBanned = gym?.banned_members || [];
      return base44.entities.Gym.update(gymId, { 
        banned_members: [...currentBanned, userId] 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
    }
  });

  const unbanMemberMutation = useMutation({
    mutationFn: (userId) => {
      const currentBanned = gym?.banned_members || [];
      return base44.entities.Gym.update(gymId, { 
        banned_members: currentBanned.filter(id => id !== userId) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
    }
  });

  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';
  const currentCoach = currentUser && coaches.find(c => c.user_email === currentUser.email);
  const isCoach = !!currentCoach;
  const showOwnerControls = isGymOwner && !viewAsMember;
  const canManageEvents = isGymOwner || (currentCoach?.can_manage_events ?? false);
  const canManageClasses = isGymOwner || (currentCoach?.can_manage_classes ?? false);
  const canPost = isGymOwner || (currentCoach?.can_post ?? false);
  const isMember = !!gymMembership || isGymOwner;

  // System-generated challenges with participant counts
  const systemChallenges = [
    {
      id: 'weekend-warrior',
      title: '🔥 Weekend Warrior',
      description: 'Check in 3 times this weekend (Sat-Sun)',
      type: 'weekend',
      timeframe: 'This Weekend',
      reward: 'Free protein shake',
      participants: 23
    },
    {
      id: 'weekly-grind',
      title: '💪 Weekly Grind',
      description: 'Complete 5 workouts this week',
      type: 'weekly',
      timeframe: 'This Week',
      reward: '£5 off next month',
      participants: 47
    },
    {
      id: 'streak-starter',
      title: '⚡ Streak Starter',
      description: 'Build a 3-day streak',
      type: 'streak',
      timeframe: '3 Days',
      reward: 'Free gym merchandise',
      participants: 31
    }
  ];

  // Mock leaderboard data
  const weeklyLeaders = members.slice(0, 3).map((member, idx) => ({
    id: member.id,
    name: member.name || member.nickname || 'Member',
    progress: ['100%', '95%', '87%'][idx],
    score: [500, 475, 435][idx]
  }));

  // Get upcoming events (next 7 days)
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.event_date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekFromNow;
  }).slice(0, 2);

  // Calculate weekly check-ins per user
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCheckIns = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);

  const checkInLeaderboard = Object.values(
    weeklyCheckIns.reduce((acc, checkIn) => {
      const userId = checkIn.user_id;
      if (!acc[userId]) {
        acc[userId] = { userId, userName: checkIn.user_name, count: 0 };
      }
      acc[userId].count++;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count).slice(0, 10);

  // Calculate challenge completions (mock data for now)
  const challengeLeaderboard = members.slice(0, 10).map((member, idx) => ({
    userId: member.id,
    userName: member.name || member.nickname || 'Member',
    count: Math.max(0, 15 - idx * 2)
  })).filter(m => m.count > 0);

  // Calculate streaks (mock data based on check-ins)
  const streakLeaderboard = Object.values(
    checkIns.reduce((acc, checkIn) => {
      const userId = checkIn.user_id;
      if (!acc[userId]) {
        acc[userId] = { userId, userName: checkIn.user_name, streak: Math.floor(Math.random() * 30) + 1 };
      }
      return acc;
    }, {})
  ).sort((a, b) => b.streak - a.streak).slice(0, 10);

  if (gymLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gym...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-gray-600 mb-4">Gym not found</p>
          <Link to={createPageUrl('Gyms')}>
            <Button>Back to Gyms</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Header Section - 15% of screen */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 px-6 py-8 relative">
        {isGymOwner && (
          <Button
            onClick={() => setViewAsMember(!viewAsMember)}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 bg-white/90 backdrop-blur hover:bg-white rounded-full text-xs"
          >
            {viewAsMember ? '👤 Member' : '👑 Owner'}
          </Button>
        )}
        {isCoach && !isGymOwner && (
          <div className="absolute top-4 right-4 bg-blue-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-semibold">
            🎓 Coach
          </div>
        )}

        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Gym Logo - Circle, Left Side */}
          <div className="flex-shrink-0">
            {gym.image_url ? (
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border-4 border-white/50 overflow-hidden shadow-lg">
                <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur border-4 border-white/50 flex items-center justify-center shadow-lg">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          {/* Gym Name & Info - Center-Left */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">{gym.name}</h1>
              {gym.verified && <BadgeCheck className="w-5 h-5 text-white" />}
            </div>
            <p className="text-white/80 text-sm font-medium">Your fitness community 💪</p>
            <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {gym.city}
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Menu - 10% of screen */}
      <Tabs defaultValue="feed" className="w-full" onValueChange={(value) => {
        // Optional: Add analytics tracking here
      }}>
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-800/50 shadow-lg">
          <TabsList className="w-full max-w-4xl mx-auto flex justify-around bg-transparent p-0 h-12">
            <TabsTrigger 
              value="feed" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 rounded-none h-full text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-bold">Feed</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="challenges" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-purple-400 data-[state=active]:text-purple-400 rounded-none h-full text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-bold">Challenges</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-orange-400 data-[state=active]:text-orange-400 rounded-none h-full text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Events</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-3 data-[state=active]:border-pink-400 data-[state=active]:text-pink-400 rounded-none h-full text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-bold">Rewards</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

      {/* Main Content Area - Vertical Scroll */}
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24">

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-3 mt-0">
          {/* User's Position Banner */}
          {currentUser && checkInLeaderboard.length > 0 && (() => {
            const userPosition = checkInLeaderboard.findIndex(m => m.userId === currentUser.id);
            if (userPosition >= 0) {
              const userCheckIns = checkInLeaderboard[userPosition].count;
              const leaderCheckIns = checkInLeaderboard[0]?.count || 0;
              const secondPlaceCheckIns = checkInLeaderboard[1]?.count || 0;
              const diff = leaderCheckIns - userCheckIns;
              
              // Show banner if user is in top 5 and not in 1st place
              if (userPosition > 0 && userPosition < 5) {
                return (
                  <button
                    onClick={() => {
                      const challengesTab = document.querySelector('[value="challenges"]');
                      if (challengesTab) challengesTab.click();
                    }}
                    className="w-full"
                  >
                    <Card className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 shadow-lg border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                          👀
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-white text-sm">
                            You're #{userPosition + 1} this week
                          </p>
                          <p className="text-white/90 text-xs">
                            {diff === 1 
                              ? 'One more visit to take the lead 🔥' 
                              : `${diff} more visits to reach #1`}
                          </p>
                        </div>
                        <Flame className="w-6 h-6 text-white animate-pulse" />
                      </div>
                    </Card>
                  </button>
                );
              } else if (userPosition === 0) {
                // User is in 1st place
                const lead = userCheckIns - secondPlaceCheckIns;
                return (
                  <button
                    onClick={() => {
                      const challengesTab = document.querySelector('[value="challenges"]');
                      if (challengesTab) challengesTab.click();
                    }}
                    className="w-full"
                  >
                    <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 shadow-lg border-2 border-white/30 cursor-pointer hover:scale-105 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                          👑
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-black text-white text-sm">
                            You're #1 this week!
                          </p>
                          <p className="text-white/90 text-xs">
                            {lead > 0 
                              ? `Leading by ${lead} check-in${lead > 1 ? 's' : ''} 🔥` 
                              : 'Stay consistent to keep the lead!'}
                          </p>
                        </div>
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    </Card>
                  </button>
                );
              }
            }
            return null;
          })()}

          {/* Check-in Section */}
          <CheckInButton gym={gym} />

          {/* Upcoming Events This Week */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">📅 This Week</h2>
              </div>
              {upcomingEvents.map((event) => (
                <WeeklyEventCard
                  key={event.id}
                  event={event}
                  onRSVP={(eventId) => {
                    const event = events.find(e => e.id === eventId);
                    rsvpMutation.mutate({ eventId, currentAttendees: event.attendees || 0 });
                  }}
                />
              ))}
            </div>
          )}

          {/* Posts Feed - Scrollable */}
          {canPost && (
            <CreateGymPostButton
              gym={gym}
              currentUser={currentUser}
              onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['posts'] })}
            />
          )}
          
          {posts.length === 0 ? (
            <Card className="p-8 text-center bg-slate-800/50 border-2 border-dashed border-slate-600/50">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-200 font-semibold mb-1">No community posts yet</p>
              <p className="text-sm text-slate-400">Be the first to share your workout! 💪</p>
            </Card>
          ) : (
            posts.slice(0, 10).map((post) => (
              <GymPostCard key={post.id} post={post} gym={gym} />
            ))
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-3 mt-0">
          {/* System Challenges */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">⚡ Quick Wins</h2>
            {systemChallenges.map((challenge) => (
              <SystemChallengeCard
                key={challenge.id}
                challenge={challenge}
                participantCount={challenge.participants}
                isJoined={hasjoinedChallenge(challenge.id)}
                onJoin={(challenge) => joinChallengeMutation.mutate(challenge)}
              />
            ))}
          </div>



          {/* Active Challenges with Progress */}
          {challenges.filter(c => c.status === 'active').length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">🏆 Active Challenges</h2>
              {challenges.filter(c => c.status === 'active').map((challenge) => (
                <ChallengeProgressCard 
                  key={challenge.id} 
                  challenge={challenge} 
                  userProgress={Math.random()} 
                />
              ))}
            </div>
          )}

          {/* Leaderboard Section */}
          <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100">Community Leaderboard</h3>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <Button
                variant={leaderboardView === 'checkins' ? 'default' : 'outline'}
                onClick={() => setLeaderboardView('checkins')}
                size="sm"
                className="rounded-2xl whitespace-nowrap"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Weekly Check-ins
              </Button>
              <Button
                variant={leaderboardView === 'challenges' ? 'default' : 'outline'}
                onClick={() => setLeaderboardView('challenges')}
                size="sm"
                className="rounded-2xl whitespace-nowrap"
              >
                <Trophy className="w-3 h-3 mr-1" />
                Challenges
              </Button>
              <Button
                variant={leaderboardView === 'streaks' ? 'default' : 'outline'}
                onClick={() => setLeaderboardView('streaks')}
                size="sm"
                className="rounded-2xl whitespace-nowrap"
              >
                <Flame className="w-3 h-3 mr-1" />
                Streaks
              </Button>
            </div>

            {leaderboardView === 'checkins' && (
              checkInLeaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400 text-sm">No check-ins this week yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {checkInLeaderboard.map((member, idx) => (
                    <div key={member.userId} className="flex items-center gap-3 p-3 bg-slate-700/60 rounded-xl border border-slate-600/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100 text-sm">{member.userName}</p>
                        <p className="text-xs text-slate-400">{member.count} check-ins this week</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              )
            )}

            {leaderboardView === 'challenges' && (
              challengeLeaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400 text-sm">No challenges completed yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {challengeLeaderboard.map((member, idx) => (
                    <div key={member.userId} className="flex items-center gap-3 p-3 bg-slate-700/60 rounded-xl border border-slate-600/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-purple-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100 text-sm">{member.userName}</p>
                        <p className="text-xs text-slate-400">{member.count} challenges completed</p>
                      </div>
                      <Trophy className="w-5 h-5 text-purple-500" />
                    </div>
                  ))}
                </div>
              )
            )}

            {leaderboardView === 'streaks' && (
              streakLeaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <Flame className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400 text-sm">No streaks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {streakLeaderboard.map((member, idx) => (
                    <div key={member.userId} className="flex items-center gap-3 p-3 bg-slate-700/60 rounded-xl border border-slate-600/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-500' : 'bg-red-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100 text-sm">{member.userName}</p>
                        <p className="text-xs text-slate-400">{member.streak} day streak</p>
                      </div>
                      <Flame className="w-5 h-5 text-orange-500" />
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>

          {/* Gym vs Gym Challenges */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-orange-600" />
              Gym Challenges
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Compete with other gyms and earn bragging rights!
            </p>
            <Link to={createPageUrl('Challenges')}>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl">
                View All Challenges
              </Button>
            </Link>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-3 mt-0">
          {/* Classes Section */}
          <Card className="bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Classes</h3>
              {canManageClasses && (
                <Button
                  onClick={() => setShowManageClasses(true)}
                  size="sm"
                  variant="outline"
                  className="rounded-2xl"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Manage
                </Button>
              )}
            </div>
            
            {classes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm">No classes scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map((gymClass) => (
                  <div key={gymClass.id} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{gymClass.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{gymClass.description}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            {gymClass.instructor}
                          </Badge>
                          {gymClass.duration_minutes && (
                            <Badge variant="outline" className="text-xs">
                              {gymClass.duration_minutes} min
                            </Badge>
                          )}
                        </div>
                        {gymClass.schedule && gymClass.schedule.length > 0 && (
                          <div className="space-y-1">
                            {gymClass.schedule.map((slot, idx) => (
                              <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-medium">{slot.day}</span> • <span>{slot.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Events Section */}
          <Card className="bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upcoming Events</h3>
              {canManageEvents && (
                <Button
                  onClick={() => setShowCreateEvent(true)}
                  size="sm"
                  className="bg-blue-500 text-white rounded-2xl"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Button>
              )}
            </div>
            
            {events.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={(eventId) => {
                      const event = events.find(e => e.id === eventId);
                      rsvpMutation.mutate({ eventId, currentAttendees: event.attendees || 0 });
                    }}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Coaches Section */}
          <Card className="bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Coaches</h3>
              {showOwnerControls && (
                <Button
                  onClick={() => setShowManageCoaches(true)}
                  size="sm"
                  variant="outline"
                  className="rounded-2xl"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Manage
                </Button>
              )}
            </div>
            
            {coaches.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 text-sm">No coaches listed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coaches.map((coach) => (
                  <div key={coach.id} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {coach.avatar_url ? (
                          <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white">{coach.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{coach.name}</h4>
                          {coach.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-bold">{coach.rating}</span>
                            </div>
                          )}
                        </div>
                        {coach.bio && <p className="text-xs text-gray-600 mb-2">{coach.bio}</p>}
                        {coach.specialties && coach.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {coach.specialties.map((specialty, idx) => (
                              <Badge key={idx} className="bg-blue-100 text-blue-700 text-xs">{specialty}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-3 mt-0">
          {/* Gym Bonuses */}
          <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-cyan-600" />
              Gym Bonuses
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-white border-2 border-cyan-200 rounded-xl">
                <div className="text-2xl">🎟️</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Free First Day Pass</p>
                  <p className="text-xs text-gray-600 mt-0.5">Try the gym for free on your first visit</p>
                  <Button 
                    size="sm" 
                    onClick={() => claimBonusMutation.mutate({ 
                      bonusType: 'free_day_pass', 
                      offerDetails: 'Free First Day Pass' 
                    })}
                    disabled={hasClaimedBonus('free_day_pass') || claimBonusMutation.isPending}
                    className={`mt-2 ${hasClaimedBonus('free_day_pass') ? 'bg-green-500' : 'bg-cyan-500 hover:bg-cyan-600'} text-white rounded-2xl text-xs w-full`}
                  >
                    {hasClaimedBonus('free_day_pass') ? '✓ Claimed' : 'Claim Pass'}
                  </Button>
                </div>
              </div>
              {gym.reward_offer && (
                <div className="flex items-start gap-3 p-3 bg-white border-2 border-orange-200 rounded-xl">
                  <div className="text-2xl">🎁</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{gym.reward_offer}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Special gym offer</p>
                    <Button 
                      size="sm" 
                      onClick={() => claimBonusMutation.mutate({ 
                        bonusType: 'gym_offer', 
                        offerDetails: gym.reward_offer 
                      })}
                      disabled={hasClaimedBonus('gym_offer') || claimBonusMutation.isPending}
                      className={`mt-2 ${hasClaimedBonus('gym_offer') ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded-2xl text-xs w-full`}
                    >
                      {hasClaimedBonus('gym_offer') ? '✓ Claimed' : 'Claim Offer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Monthly Leaderboard Prizes */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Monthly Leaderboard Prizes
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-black text-white text-sm">1</div>
                <p className="text-sm font-medium text-gray-900">Free month + £50 voucher</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-300 rounded-xl">
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center font-black text-white text-sm">2</div>
                <p className="text-sm font-medium text-gray-900">50% off + £25 voucher</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 border-2 border-orange-300 rounded-xl">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-black text-white text-sm">3</div>
                <p className="text-sm font-medium text-gray-900">25% off + £10 voucher</p>
              </div>
            </div>
          </Card>



          {/* Member Rewards */}
          {!isMember ? (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-5">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Member Rewards</h3>
                <p className="text-sm text-purple-700">Join this gym to unlock exclusive rewards!</p>
              </div>
              <Button
                onClick={() => setShowJoinGymModal(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl mb-2"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Join Gym
              </Button>
              <button
                onClick={() => setShowJoinGymModal(true)}
                className="w-full text-sm text-purple-700 font-medium underline"
              >
                Already a member? Register here
              </button>
            </Card>
          ) : rewards.filter(r => r.active).length > 0 ? (
            <Card className="bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Active Rewards</h3>
                {showOwnerControls && (
                  <Button
                    onClick={() => setShowManageRewards(true)}
                    size="sm"
                    variant="outline"
                    className="rounded-2xl"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Manage
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {rewards.filter(r => r.active).map((reward) => {
                  const hasUserClaimed = reward.claimed_by?.includes(currentUser?.id);
                  return (
                    <div key={reward.id} className="bg-gray-50 border border-gray-200 p-4 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{reward.icon || '🎁'}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{reward.title}</h4>
                          {reward.description && (
                            <p className="text-xs text-gray-600 mt-1">{reward.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reward.value && (
                              <Badge className="bg-green-100 text-green-700 text-xs">{reward.value}</Badge>
                            )}
                            <Badge variant="outline" className="capitalize text-xs">
                              {reward.requirement.replace('_', ' ')}
                            </Badge>
                          </div>
                          {currentUser && (
                            <Button
                              size="sm"
                              disabled={hasUserClaimed}
                              onClick={() => {
                                if (!hasUserClaimed) {
                                  claimRewardMutation.mutate({
                                    rewardId: reward.id,
                                    userId: currentUser.id,
                                    currentClaimed: reward.claimed_by || []
                                  });
                                }
                              }}
                              className={`mt-2 w-full rounded-2xl text-xs ${
                                hasUserClaimed 
                                  ? 'bg-gray-200 text-gray-500' 
                                  : 'bg-purple-500 hover:bg-purple-600 text-white'
                              }`}
                            >
                              {hasUserClaimed ? '✓ Claimed' : 'Claim Reward'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          {/* Manage Rewards Button for Gym Owners */}
          {showOwnerControls && rewards.filter(r => r.active).length === 0 && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-5">
              <div className="text-center">
                <Gift className="w-12 h-12 mx-auto mb-3 text-purple-500" />
                <h3 className="font-bold text-gray-900 mb-2">Create Member Rewards</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Motivate your members with rewards!
                </p>
                <Button
                  onClick={() => setShowManageRewards(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rewards
                </Button>
              </div>
            </Card>
          )}

          {/* Manage Members - Gym Owners Only */}
          {showOwnerControls && (
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Member Management</h3>
                    <p className="text-sm text-blue-700">Manage your gym members</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowManageMembers(true)}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl"
                >
                  Manage
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </div>
      </Tabs>

      <CreateEventModal
          open={showCreateEvent}
          onClose={() => setShowCreateEvent(false)}
          onSave={(data) => createEventMutation.mutate(data)}
          gym={gym}
          isLoading={createEventMutation.isPending}
        />

        <ManageEquipmentModal
          open={showManageEquipment}
          onClose={() => setShowManageEquipment(false)}
          equipment={gym?.equipment || []}
          onSave={(equipment) => updateEquipmentMutation.mutate(equipment)}
          isLoading={updateEquipmentMutation.isPending}
        />

        <ManageRewardsModal
          open={showManageRewards}
          onClose={() => setShowManageRewards(false)}
          rewards={rewards}
          onCreateReward={(data) => createRewardMutation.mutate(data)}
          onDeleteReward={(id) => deleteRewardMutation.mutate(id)}
          gym={gym}
          isLoading={createRewardMutation.isPending}
        />

        <ManageClassesModal
          open={showManageClasses}
          onClose={() => setShowManageClasses(false)}
          classes={classes}
          onCreateClass={(data) => createClassMutation.mutate(data)}
          onDeleteClass={(id) => deleteClassMutation.mutate(id)}
          gym={gym}
          isLoading={createClassMutation.isPending}
        />

        <ManageCoachesModal
          open={showManageCoaches}
          onClose={() => setShowManageCoaches(false)}
          coaches={coaches}
          onCreateCoach={(data) => createCoachMutation.mutate(data)}
          onDeleteCoach={(id) => deleteCoachMutation.mutate(id)}
          onUpdateCoach={(coachId, data) => updateCoachMutation.mutate({ coachId, data })}
          gym={gym}
          isLoading={createCoachMutation.isPending}
        />

        <ManageGymPhotosModal
          open={showManagePhotos}
          onClose={() => setShowManagePhotos(false)}
          gallery={gym?.gallery || []}
          onSave={(gallery) => updateGalleryMutation.mutate(gallery)}
          isLoading={updateGalleryMutation.isPending}
        />

        <EditHeroImageModal
          open={showEditHeroImage}
          onClose={() => setShowEditHeroImage(false)}
          currentImageUrl={gym?.image_url}
          onSave={(image_url) => updateHeroImageMutation.mutate(image_url)}
          isLoading={updateHeroImageMutation.isPending}
        />

        <ManageMembersModal
          open={showManageMembers}
          onClose={() => setShowManageMembers(false)}
          gym={gym}
          onBanMember={(userId) => banMemberMutation.mutate(userId)}
          onUnbanMember={(userId) => unbanMemberMutation.mutate(userId)}
        />

        <UpgradeMembershipModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentUser={currentUser}
        />

        <JoinGymModal
          open={showJoinGymModal}
          onClose={() => setShowJoinGymModal(false)}
          gym={gym}
          currentUser={currentUser}
        />

      {/* Floating Action Button (FAB) - Check-in */}
      {isMember && (
        <div className="fixed bottom-20 right-6 z-30 md:bottom-8">
          <button
            onClick={() => {
              const checkInBtn = document.querySelector('[data-checkin-btn]');
              if (checkInBtn) checkInBtn.click();
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200 hover:shadow-blue-500/50"
          >
            <BadgeCheck className="w-8 h-8 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}