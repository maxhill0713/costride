import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, Calendar, Plus, Edit, GraduationCap, Clock, Target, Award, Image as ImageIcon, Crown, Dumbbell, Flame, CheckCircle, Trash2, Home, Mail, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
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

import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import EditGymLogoModal from '../components/gym/EditGymLogoModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import InviteOwnerModal from '../components/gym/InviteOwnerModal';
import UpgradeMembershipModal from '../components/membership/UpgradeMembershipModal';
import JoinGymModal from '../components/membership/JoinGymModal';
import ChallengeProgressCard from '../components/challenges/ChallengeProgressCard';
import WeeklyEventCard from '../components/feed/WeeklyEventCard';
import SystemChallengeCard from '../components/challenges/SystemChallengeCard';
import AppChallengeCard from '../components/challenges/AppChallengeCard';
import GymChallengeCard from '../components/challenges/GymChallengeCard';
import MiniLeaderboard from '../components/challenges/MiniLeaderboard';

import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import PullToRefresh from '../components/PullToRefresh';
import PollCard from '../components/polls/PollCard';
// i18n import removed - using default language

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
  const [showEditGymLogo, setShowEditGymLogo] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [viewAsMember, setViewAsMember] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showJoinGymModal, setShowJoinGymModal] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [copiedCoachId, setCopiedCoachId] = useState(null);
  const [showInviteOwner, setShowInviteOwner] = useState(false);

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

  // Language setting stored on gym

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
      const filtered = allChallenges.filter(c => c.gym_id === gymId && c.is_app_challenge !== true);
      console.log('Challenges fetched:', filtered);
      return filtered;
    },
    enabled: !!gymId
  });

  const { data: polls = [] } = useQuery({
    queryKey: ['polls', gymId],
    queryFn: async () => {
      const allPolls = await base44.entities.Poll.list('-created_date');
      return allPolls.filter(p => p.gym_id === gymId && p.status === 'active');
    },
    enabled: !!gymId
  });

  // Only gym challenges now
  const gymChallenges = challenges.filter(c => c.status === 'active' || c.status === 'upcoming');

  const { data: allGyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
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

  const deleteChallengeMutation = useMutation({
    mutationFn: (challengeId) => base44.entities.Challenge.delete(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => base44.entities.Event.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gymId] });
    }
  });

  const votePollMutation = useMutation({
    mutationFn: async ({ pollId, optionId }) => {
      const poll = polls.find(p => p.id === pollId);
      const updatedOptions = poll.options.map(opt => 
        opt.id === optionId 
          ? { ...opt, votes: opt.votes + 1 }
          : opt
      );
      const updatedVoters = [...(poll.voters || []), currentUser.id];
      
      await base44.entities.Poll.update(pollId, {
        options: updatedOptions,
        voters: updatedVoters
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', gymId] });
    }
  });

  const updateCoachMutation = useMutation({
    mutationFn: ({ coachId, data }) => base44.entities.Coach.update(coachId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaches', gymId] });
    }
  });

  const createChallengeMutation = useMutation({
    mutationFn: (challengeData) => {
      const fullData = {
        ...challengeData,
        gym_id: gymId,
        gym_name: gym?.name
      };
      console.log('Creating challenge with data:', fullData);
      return base44.entities.Challenge.create(fullData);
    },
    onSuccess: (response) => {
      console.log('Challenge created successfully:', response);
      console.log('Invalidating queries for gymId:', gymId);
      queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });
      console.log('Modal closing...');
      setShowCreateChallenge(false);
    },
    onError: (error) => {
      console.error('Challenge creation failed:', error);
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

  const updateGymLogoMutation = useMutation({
    mutationFn: (logo_url) => base44.entities.Gym.update(gymId, { logo_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
      setShowEditGymLogo(false);
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
    mutationFn: async (challenge) => {
      // Update Challenge participants array first
      const currentParticipants = challenge.participants || [];
      await base44.entities.Challenge.update(challenge.id, {
        participants: [...currentParticipants, currentUser.id]
      });
      
      // Create ChallengeParticipant record
      await base44.entities.ChallengeParticipant.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        challenge_id: challenge.id,
        challenge_title: challenge.title,
        progress: 0,
        completed: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['activeChallenges'] });
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

  const meetsRequirement = (requirement) => {
    if (!currentUser) return false;

    const userCheckIns = checkIns.filter(c => c.user_id === currentUser.id);
    
    switch (requirement) {
      case 'first_visit':
        return userCheckIns.length >= 1;
      case 'visits_3':
        return userCheckIns.length >= 3;
      case 'visits_5':
        return userCheckIns.length >= 5;
      case 'visits_10':
      case 'check_ins_10':
        return userCheckIns.length >= 10;
      case 'visits_25':
        return userCheckIns.length >= 25;
      case 'visits_50':
      case 'check_ins_50':
        return userCheckIns.length >= 50;
      case 'visits_100':
        return userCheckIns.length >= 100;
      case 'streak_7':
        return calculateCurrentStreak(userCheckIns) >= 7;
      case 'streak_30':
        return calculateCurrentStreak(userCheckIns) >= 30;
      case 'streak_90':
        return calculateCurrentStreak(userCheckIns) >= 90;
      case 'referral_3':
      case 'referral':
        return false;
      case 'referral_10':
        return false;
      case 'challenge_winner':
        return false;
      case 'points':
      case 'none':
        return true;
      default:
        return true;
    }
  };

  const getRequirementProgress = (requirement, rewardCreatedDate) => {
    if (!currentUser) return { current: 0, target: 1, percentage: 0 };

    // Only count check-ins after the reward was created
    const userCheckIns = checkIns.filter(c => 
      c.user_id === currentUser.id && 
      new Date(c.check_in_date) >= new Date(rewardCreatedDate)
    );
    const currentStreak = calculateCurrentStreak(userCheckIns);
    
    switch (requirement) {
      case 'first_visit':
        return { current: Math.min(userCheckIns.length, 1), target: 1, percentage: Math.min(userCheckIns.length / 1 * 100, 100) };
      case 'visits_3':
        return { current: Math.min(userCheckIns.length, 3), target: 3, percentage: Math.min(userCheckIns.length / 3 * 100, 100) };
      case 'visits_5':
        return { current: Math.min(userCheckIns.length, 5), target: 5, percentage: Math.min(userCheckIns.length / 5 * 100, 100) };
      case 'visits_10':
      case 'check_ins_10':
        return { current: Math.min(userCheckIns.length, 10), target: 10, percentage: Math.min(userCheckIns.length / 10 * 100, 100) };
      case 'visits_25':
        return { current: Math.min(userCheckIns.length, 25), target: 25, percentage: Math.min(userCheckIns.length / 25 * 100, 100) };
      case 'visits_50':
      case 'check_ins_50':
        return { current: Math.min(userCheckIns.length, 50), target: 50, percentage: Math.min(userCheckIns.length / 50 * 100, 100) };
      case 'visits_100':
        return { current: Math.min(userCheckIns.length, 100), target: 100, percentage: Math.min(userCheckIns.length / 100 * 100, 100) };
      case 'streak_7':
        return { current: Math.min(currentStreak, 7), target: 7, percentage: Math.min(currentStreak / 7 * 100, 100) };
      case 'streak_30':
        return { current: Math.min(currentStreak, 30), target: 30, percentage: Math.min(currentStreak / 30 * 100, 100) };
      case 'streak_90':
        return { current: Math.min(currentStreak, 90), target: 90, percentage: Math.min(currentStreak / 90 * 100, 100) };
      case 'referral_3':
      case 'referral':
        return { current: 0, target: 3, percentage: 0 };
      case 'referral_10':
        return { current: 0, target: 10, percentage: 0 };
      case 'challenge_winner':
        return { current: 0, target: 1, percentage: 0 };
      case 'points':
      case 'none':
        return { current: 1, target: 1, percentage: 100 };
      default:
        return { current: 1, target: 1, percentage: 100 };
    }
  };

  const calculateCurrentStreak = (userCheckIns) => {
    if (userCheckIns.length === 0) return 0;

    const sortedCheckIns = [...userCheckIns].sort((a, b) => 
      new Date(b.check_in_date) - new Date(a.check_in_date)
    );

    let streak = 1;
    let currentDate = new Date(sortedCheckIns[0].check_in_date);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedCheckIns.length; i++) {
      const checkInDate = new Date(sortedCheckIns[i].check_in_date);
      checkInDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate - checkInDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        streak++;
        currentDate = checkInDate;
      } else if (daysDiff > 1) {
        break;
      }
    }

    return streak;
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
  const isGhostGym = gym && !gym.admin_id && !gym.owner_email;
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
    <PullToRefresh onRefresh={async () => {
      await queryClient.invalidateQueries();
    }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
        {/* Back Button - Fixed at top */}
        <div className="sticky top-0 z-30 px-4 pt-4 pb-2 bg-gradient-to-b from-slate-900 to-transparent backdrop-blur-sm">
          <Link to={createPageUrl('Gyms')}>
            <Button
              variant="ghost"
              size="sm"
              className="bg-slate-800/80 backdrop-blur hover:bg-slate-700/90 text-white rounded-xl border border-slate-600/50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Gyms
            </Button>
          </Link>
        </div>

        {/* Header Background with Gym Hero Image */}
      <div className="relative h-48 bg-black overflow-hidden">
        {gym.image_url ? (
          <img 
            src={gym.image_url} 
            alt={gym.name} 
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>

        {/* Header Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isGhostGym && !isGymOwner && (
            <Button
              onClick={() => setShowInviteOwner(true)}
              variant="ghost"
              size="sm"
              className="bg-purple-500/90 backdrop-blur hover:bg-purple-600 rounded-full text-xs text-white"
            >
              <Crown className="w-4 h-4 mr-1" />
              Invite Owner
            </Button>
          )}
          {showOwnerControls && (
            <Button
              onClick={() => setShowEditHeroImage(true)}
              variant="ghost"
              size="sm"
              className="bg-white/90 backdrop-blur hover:bg-white rounded-full text-xs"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Hero
            </Button>
          )}
          {isGymOwner && (
            <Button
              onClick={() => setViewAsMember(!viewAsMember)}
              variant="ghost"
              size="sm"
              className="bg-white/90 backdrop-blur hover:bg-white rounded-full text-xs"
            >
              {viewAsMember ? '👤 Member' : '👑 Owner'}
            </Button>
          )}
          {isCoach && !isGymOwner && (
            <div className="bg-blue-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-semibold">
              🎓 Coach
            </div>
          )}
        </div>

        {/* Gym Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-6">
          <div className="max-w-4xl mx-auto flex items-end gap-4">
            {/* Gym Logo */}
            <div className="flex-shrink-0 relative">
              {gym.logo_url ? (
                <button
                  onClick={() => showOwnerControls && setShowEditGymLogo(true)}
                  className={`w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border-3 border-white/30 overflow-hidden shadow-lg ${showOwnerControls ? 'hover:border-white/50 transition-all cursor-pointer' : ''}`}
                >
                  <img src={gym.logo_url} alt={gym.name} className="w-full h-full object-cover" />
                </button>
              ) : (
                <button
                  onClick={() => showOwnerControls && setShowEditGymLogo(true)}
                  className={`w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border-3 border-white/30 flex items-center justify-center shadow-lg ${showOwnerControls ? 'hover:border-white/50 transition-all cursor-pointer' : ''}`}
                >
                  <Dumbbell className="w-10 h-10 text-white" />
                </button>
              )}
              {showOwnerControls && (
                <button
                  onClick={() => setShowEditGymLogo(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-all"
                  title="Upload profile picture"
                >
                  <ImageIcon className="w-3 h-3 text-white" />
                </button>
              )}
            </div>

            {/* Gym Name & Info */}
            <div className="flex-1 text-left pb-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg break-words">{gym.name}</h1>
                {gym.verified && <BadgeCheck className="w-5 md:w-6 h-5 md:h-6 text-white drop-shadow-lg flex-shrink-0" />}
              </div>
              <p className="text-white/90 text-sm font-medium drop-shadow-md">Your fitness community 💪</p>
              <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1 drop-shadow-md">
                <MapPin className="w-3 h-3" />
                {gym.city}
              </p>

            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Menu - 10% of screen */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">
        <div className="sticky top-0 z-20 bg-slate-900/98 backdrop-blur-xl overflow-x-hidden">
            <TabsList className="w-screen md:w-full md:max-w-4xl mx-auto flex justify-around bg-transparent p-0 h-14 overflow-x-auto md:overflow-x-visible border-0">
            <TabsTrigger 
              value="home" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 rounded-none h-full text-slate-400 hover:text-slate-300 transition-colors border-0 shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <Home className="w-4 h-4" />
                <span className="text-sm font-bold">Home</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="feed" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 rounded-none h-full text-slate-400 hover:text-slate-300 transition-colors border-0 shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-bold">Feed</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="challenges" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-purple-400 rounded-none h-full text-slate-400 hover:text-slate-300 transition-colors border-0 shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-bold">Challenges</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-orange-400 rounded-none h-full text-slate-400 hover:text-slate-300 transition-colors border-0 shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">Events</span>
              </div>
            </TabsTrigger>

          </TabsList>
        </div>

      {/* Main Content Area - Vertical Scroll */}
      <div className="max-w-4xl mx-auto px-2 md:px-4 py-2 md:py-4 pb-24 w-full overflow-hidden">

        {/* Home Tab */}
        <TabsContent value="home" className="space-y-2 md:space-y-3 mt-0 w-full overflow-hidden">
          {/* Check-in Section */}
           {!showOwnerControls && <CheckInButton gym={gym} />}

           {/* Polls Section */}
           {polls.length > 0 && (
             <div className="space-y-2">
               {polls.map((poll) => (
                 <PollCard
                   key={poll.id}
                   poll={poll}
                   onVote={!showOwnerControls ? (optionId) => votePollMutation.mutate({ pollId: poll.id, optionId }) : null}
                   userVoted={currentUser?.id}
                   isLoading={votePollMutation.isPending}
                 />
               ))}
             </div>
           )}

           {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/40 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-xs md:text-sm font-bold text-slate-100">Member Count</h3>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white">{gym?.members_count || 0}</p>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                <h3 className="text-xs md:text-sm font-bold text-slate-100">Challenges Available</h3>
              </div>
              <p className="text-2xl md:text-3xl font-black text-white">{gymChallenges.length}</p>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 p-3 md:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-green-400" />
                  <h3 className="text-xs md:text-sm font-bold text-slate-100">In Gym Now</h3>
                </div>
                {(() => {
                  const now = new Date();
                  const usersInGym = new Set();
                  checkIns.forEach(checkIn => {
                    const checkInTime = new Date(checkIn.check_in_date);
                    if ((now - checkInTime) < 2 * 60 * 60 * 1000) {
                      usersInGym.add(checkIn.user_id);
                    }
                  });
                  const count = usersInGym.size;
                  const vibe = count === 0 ? { text: 'Peaceful', color: 'text-blue-400', emoji: '🧘' } :
                               count <= 3 ? { text: 'Focused', color: 'text-cyan-400', emoji: '🎯' } :
                               count <= 8 ? { text: 'Active', color: 'text-green-400', emoji: '💪' } :
                               count <= 15 ? { text: 'Energetic', color: 'text-orange-400', emoji: '🔥' } :
                               { text: 'Buzzing', color: 'text-purple-400', emoji: '⚡' };
                  return (
                    <Badge className={`${vibe.color} bg-slate-700/50 border-slate-600 text-xs px-2 py-0`}>
                      {vibe.emoji} {vibe.text}
                    </Badge>
                  );
                })()}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl md:text-3xl font-black text-white">
                  {(() => {
                    const now = new Date();
                    const usersInGym = new Set();
                    checkIns.forEach(checkIn => {
                      const checkInTime = new Date(checkIn.check_in_date);
                      if ((now - checkInTime) < 2 * 60 * 60 * 1000) {
                        usersInGym.add(checkIn.user_id);
                      }
                    });
                    return usersInGym.size;
                  })()}
                </p>
                <p className="text-xs text-slate-300">
                  {(() => {
                    const now = new Date();
                    const usersInGym = new Set();
                    checkIns.forEach(checkIn => {
                      const checkInTime = new Date(checkIn.check_in_date);
                      if ((now - checkInTime) < 2 * 60 * 60 * 1000) {
                        usersInGym.add(checkIn.user_id);
                      }
                    });
                    return usersInGym.size === 1 ? 'member' : 'members';
                  })()}
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-1">Great time to train!</p>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-2 border-orange-500/40 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-orange-400" />
                <h3 className="text-xs md:text-sm font-bold text-slate-100">Your Progress</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-300 mb-1">Times Visited</p>
                  <p className="text-xl md:text-2xl font-black text-white">
                    {currentUser ? checkIns.filter(c => c.user_id === currentUser.id).length : 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-300 mb-1">Current Streak</p>
                  <p className="text-xl md:text-2xl font-black text-white flex items-center gap-1">
                    {currentUser ? calculateCurrentStreak(checkIns.filter(c => c.user_id === currentUser.id)) : 0}
                    <Flame className="w-4 h-4 text-orange-400" />
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <Card className="bg-slate-800/60 backdrop-blur-sm border-2 border-orange-500/40 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm md:text-base font-bold text-slate-100">This Week</h3>
              </div>
              <div className="space-y-2">
                {upcomingEvents.slice(0, 2).map((event) => (
                  <WeeklyEventCard
                    key={event.id}
                    event={event}
                    onRSVP={!showOwnerControls ? (eventId) => {
                      const event = events.find(e => e.id === eventId);
                      rsvpMutation.mutate({ eventId, currentAttendees: event.attendees || 0 });
                    } : null}
                    disabled={showOwnerControls}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* New Challenges */}
          {gymChallenges.length > 0 && (
            <Card className="bg-slate-900/70 backdrop-blur-sm border border-purple-500/30 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm md:text-base font-bold text-slate-100">New Challenges</h3>
              </div>
              <div className="space-y-2">
                {gymChallenges.slice(0, 2).map((challenge) => (
                  <GymChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    isJoined={hasjoinedChallenge(challenge.id)}
                    onJoin={!showOwnerControls ? (challenge) => joinChallengeMutation.mutate(challenge) : null}
                    currentUser={currentUser}
                    disabled={showOwnerControls}
                    isOwner={showOwnerControls}
                    onDelete={null}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Recent Posts */}
          {posts.length > 0 && (
            <Card className="bg-slate-900/70 backdrop-blur-sm border border-blue-500/30 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm md:text-base font-bold text-slate-100">Recent Posts</h3>
                </div>
                <button 
                  onClick={() => setActiveTab('feed')}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-2">
                {posts.slice(0, 1).map((post) => (
                  <GymPostCard key={post.id} post={post} gym={gym} isOwner={showOwnerControls} />
                ))}
              </div>
            </Card>
          )}

        </TabsContent>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-2 mt-0 w-full overflow-hidden">
          {/* Upcoming Events This Week */}
           {upcomingEvents.length > 0 && (
             <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-gray-900">📅 This Week</h2>
              </div>
              {upcomingEvents.map((event) => (
                <WeeklyEventCard
                  key={event.id}
                  event={event}
                  onRSVP={!showOwnerControls ? (eventId) => {
                    const event = events.find(e => e.id === eventId);
                    rsvpMutation.mutate({ eventId, currentAttendees: event.attendees || 0 });
                  } : null}
                  disabled={showOwnerControls}
                />
              ))}
            </div>
          )}

          {/* Posts Feed - Scrollable */}
          {showOwnerControls && (
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
          <div className="space-y-3">
            {posts.slice(0, 10).map((post) => (
              <GymPostCard key={post.id} post={post} gym={gym} isOwner={showOwnerControls} />
            ))}
          </div>
          )}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-2 md:space-y-4 mt-0 w-full overflow-hidden">
          {/* Create Challenge Button for Owners */}
          {showOwnerControls && (
            <Button
              onClick={() => setShowCreateChallenge(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl h-auto py-3 flex-col gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-bold">Create Gym Challenge</span>
            </Button>
          )}



          {/* Gym Challenges - Gym-specific challenges */}
          {gymChallenges.length > 0 && (
            <div className="space-y-11">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Trophy className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-transparent bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text tracking-tight">
                    Gym Challenges
                  </h2>
                  <p className="text-sm text-slate-300/80 font-medium mt-0.5">
                    Exclusive from {gym.name}
                  </p>
                </div>
              </div>
              {gymChallenges.map((challenge) => (
                <GymChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isJoined={hasjoinedChallenge(challenge.id)}
                  onJoin={!showOwnerControls ? (challenge) => joinChallengeMutation.mutate(challenge) : null}
                  currentUser={currentUser}
                  disabled={showOwnerControls}
                  isOwner={showOwnerControls}
                  onDelete={showOwnerControls ? (challengeId) => {
                    if (window.confirm('Delete this challenge?')) {
                      deleteChallengeMutation.mutate(challengeId);
                    }
                  } : null}
                />
              ))}
              </div>
              )}

              {/* Empty State */}
              {gymChallenges.length === 0 && (
                <Card className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/40 p-8 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-300 font-semibold mb-2">No Active Challenges</p>
                  <p className="text-sm text-slate-400">Check back soon for new challenges!</p>
                </Card>
              )}

          {/* Leaderboard Section */}
          <Card className="bg-gradient-to-br from-purple-600/20 via-slate-800/80 to-blue-600/20 backdrop-blur-sm border-2 border-purple-500/30 p-3 md:p-5 shadow-lg shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                Community Leaderboard
              </h3>
            </div>

            <div className="flex gap-1 md:gap-2 mb-2 md:mb-4 overflow-x-auto pb-2">
              <Button
                variant={leaderboardView === 'checkins' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardView('checkins')}
                  size="sm"
                  className={`rounded-2xl whitespace-nowrap text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 ${
                    leaderboardView === 'checkins' ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-0' : 'border-slate-600'
                  }`}
                >
                  <CheckCircle className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
                  <span className="hidden sm:inline">Weekly </span>Check-ins
                </Button>
                <Button
                  variant={leaderboardView === 'challenges' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardView('challenges')}
                  size="sm"
                  className={`rounded-2xl whitespace-nowrap text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 ${
                    leaderboardView === 'challenges' ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-0' : 'border-slate-600'
                  }`}
                >
                  <Trophy className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
                  <span className="hidden sm:inline">Challenges</span>
                </Button>
                <Button
                  variant={leaderboardView === 'streaks' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardView('streaks')}
                  size="sm"
                  className={`rounded-2xl whitespace-nowrap text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 ${
                    leaderboardView === 'streaks' ? 'bg-gradient-to-r from-orange-500 to-red-500 border-0' : 'border-slate-600'
                  }`}
                >
                  <Flame className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
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
                <div className="space-y-1.5 md:space-y-2">
                  {checkInLeaderboard.map((member, idx) => (
                    <div key={member.userId} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 transition-all ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-md shadow-yellow-500/20' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/40 shadow-md shadow-gray-400/20' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 shadow-md shadow-orange-500/20' :
                      'bg-slate-700/40 border-slate-600/30'
                    }`}>
                      <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs md:text-sm shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                        idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                        idx === 2 ? 'bg-gradient-to-br from-orange-500 to-red-600' : 
                        'bg-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-xs md:text-sm">{member.userName}</p>
                        <p className="text-xs text-slate-300">{member.count} check-ins</p>
                      </div>
                      <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-400 flex-shrink-0" />
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
                <div className="space-y-1.5 md:space-y-2">
                  {challengeLeaderboard.map((member, idx) => (
                    <div key={member.userId} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 transition-all ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-md shadow-yellow-500/20' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/40 shadow-md shadow-gray-400/20' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 shadow-md shadow-orange-500/20' :
                      'bg-slate-700/40 border-slate-600/30'
                    }`}>
                      <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs md:text-sm shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                        idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                        idx === 2 ? 'bg-gradient-to-br from-orange-500 to-red-600' : 
                        'bg-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-xs md:text-sm">{member.userName}</p>
                        <p className="text-xs text-slate-300">{member.count} completed</p>
                      </div>
                      <Trophy className="w-4 md:w-5 h-4 md:h-5 text-purple-400 flex-shrink-0" />
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
                <div className="space-y-1.5 md:space-y-2">
                  {streakLeaderboard.map((member, idx) => (
                    <div key={member.userId} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 transition-all ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-md shadow-yellow-500/20' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/40 shadow-md shadow-gray-400/20' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/40 shadow-md shadow-orange-500/20' :
                      'bg-slate-700/40 border-slate-600/30'
                    }`}>
                      <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center font-bold text-white text-xs md:text-sm shadow-lg ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 
                        idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : 
                        idx === 2 ? 'bg-gradient-to-br from-orange-500 to-red-600' : 
                        'bg-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-xs md:text-sm">{member.userName}</p>
                        <p className="text-xs text-slate-300">{member.streak}d streak</p>
                      </div>
                      <Flame className="w-4 md:w-5 h-4 md:h-5 text-orange-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-2 md:space-y-3 mt-0 w-full overflow-hidden">
          {/* Classes Section */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border border-blue-500/30 p-2 md:p-5">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-slate-100">Classes</h3>
              {showOwnerControls && (
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
              <div className="p-8 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                <p className="text-slate-400 text-sm">No classes scheduled</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {classes.map((gymClass) => (
                  <div key={gymClass.id} className="bg-slate-700/50 border border-slate-600/40 p-2 md:p-4 rounded-2xl hover:bg-slate-700/70 transition-all flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                      <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 md:w-6 h-5 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm md:text-base mb-0.5 md:mb-1 line-clamp-1">{gymClass.name}</h4>
                        <p className="text-xs text-slate-300 mb-1 md:mb-2 line-clamp-1">{gymClass.description}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                            {gymClass.instructor}
                          </Badge>
                          {gymClass.duration_minutes && (
                            <Badge variant="outline" className="text-xs bg-slate-600/50 text-slate-200 border-slate-500">
                              {gymClass.duration_minutes} min
                            </Badge>
                          )}
                        </div>
                        {gymClass.schedule && gymClass.schedule.length > 0 && (
                          <div className="space-y-1">
                            {gymClass.schedule.map((slot, idx) => (
                              <div key={idx} className="text-xs text-slate-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="font-medium">{slot.day}</span> • <span>{slot.time}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {showOwnerControls && (
                      <Button
                        onClick={() => {
                          if (window.confirm('Delete this class?')) {
                            deleteClassMutation.mutate(gymClass.id);
                          }
                        }}
                        variant="outline"
                        size="icon"
                        className="border-red-500/50 hover:bg-red-500/10 hover:border-red-500 flex-shrink-0 min-h-[44px] min-w-[44px]"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Events Section */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border border-orange-500/30 p-2 md:p-5">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-slate-100">Upcoming Events</h3>
              {showOwnerControls && (
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
            
            {events.filter(e => new Date(e.event_date) >= new Date()).length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                <p className="text-slate-400 text-sm">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {events.filter(e => new Date(e.event_date) >= new Date()).slice(0, 5).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={(eventId) => {
                      const event = events.find(e => e.id === eventId);
                      rsvpMutation.mutate({ eventId, currentAttendees: event.attendees || 0 });
                    }}
                    isOwner={showOwnerControls}
                    onDelete={showOwnerControls ? (eventId) => {
                      if (window.confirm('Delete this event?')) {
                        deleteEventMutation.mutate(eventId);
                      }
                    } : null}
                  />
                ))}
              </div>
            )}
          </Card>



          {/* Coaches Section */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border border-purple-500/30 p-2 md:p-5">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <h3 className="text-base md:text-lg font-bold text-slate-100">Coaches</h3>
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
              <div className="p-8 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
                <GraduationCap className="w-12 h-12 mx-auto mb-2 text-slate-500" />
                <p className="text-slate-400 text-sm">No coaches listed</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {coaches.slice(0, 5).map((coach) => {
                  const handleCopyEmail = () => {
                    navigator.clipboard.writeText(coach.user_email);
                    setCopiedCoachId(coach.id);
                    setTimeout(() => setCopiedCoachId(null), 2000);
                  };

                  return (
                    <div key={coach.id} className="bg-slate-700/50 border border-slate-600/40 p-2 md:p-4 rounded-2xl hover:bg-slate-700/70 transition-all">
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {coach.avatar_url ? (
                            <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-white">{coach.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                            <h4 className="font-semibold text-white text-sm md:text-base line-clamp-1">{coach.name}</h4>
                            {coach.rating && (
                              <div className="flex items-center gap-0.5">
                                <Star className="w-2.5 md:w-3 h-2.5 md:h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                <span className="text-[10px] md:text-xs font-bold text-slate-200">{coach.rating}</span>
                              </div>
                            )}
                          </div>
                          {coach.bio && <p className="text-xs text-slate-300 mb-1 md:mb-2 line-clamp-1">{coach.bio}</p>}
                          {coach.specialties && coach.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {coach.specialties.map((specialty, idx) => (
                                <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">{specialty}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-600/50 rounded-lg transition-colors">
                              <Mail className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3 bg-slate-800 border-slate-700">
                            <div className="flex items-center gap-2">
                              <a href={`mailto:${coach.user_email}`} className="text-blue-400 hover:text-blue-300 text-sm font-medium break-all flex-1">
                                {coach.user_email}
                              </a>
                              <button
                                onClick={handleCopyEmail}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                                title="Copy email"
                              >
                                <Copy className={`w-4 h-4 ${copiedCoachId === coach.id ? 'text-green-400' : 'text-slate-400'}`} />
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
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

        <EditGymLogoModal
          open={showEditGymLogo}
          onClose={() => setShowEditGymLogo(false)}
          currentLogoUrl={gym?.logo_url}
          onSave={(logo_url) => updateGymLogoMutation.mutate(logo_url)}
          isLoading={updateGymLogoMutation.isPending}
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

        <CreateChallengeModal
                  open={showCreateChallenge}
                  onClose={() => setShowCreateChallenge(false)}
                  gyms={allGyms}
                  onSave={(data) => {
                    console.log('Challenge modal onSave called with:', data);
                    createChallengeMutation.mutate(data);
                  }}
                  isLoading={createChallengeMutation.isPending}
                />

        <InviteOwnerModal
          open={showInviteOwner}
          onClose={() => setShowInviteOwner(false)}
          gym={gym}
        />
      </div>
    </PullToRefresh>
  );
}