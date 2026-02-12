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
import BusyTimesChart from '../components/gym/BusyTimesChart';
import { motion } from 'framer-motion';
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
    queryKey: ['posts', gymId],
    queryFn: async () => {
      const allPosts = await base44.entities.Post.list('-created_date');
      // Show only gym posts (from gym owner/coaches)
      return allPosts.filter(p => p.member_id === gym?.admin_id || p.member_id === currentUser?.id);
    },
    enabled: !!gymId && !!currentUser
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', gymId],
    queryFn: async () => {
      const allCheckIns = await base44.entities.CheckIn.list('-check_in_date');
      return allCheckIns.filter(c => c.gym_id === gymId);
    },
    enabled: !!gymId
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts', gymId],
    queryFn: async () => {
      const allLifts = await base44.entities.Lift.list('-lift_date');
      return allLifts.filter(l => l.gym_id === gymId);
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

  const joinGhostGymMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GymMembership.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_email: currentUser.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'lifetime'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymMembership'] });
      // Navigate to home after successfully joining
      window.location.href = createPageUrl('Home');
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

  // Calculate weekly progress (weight increases)
  const weekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const progressLeaderboard = Object.values(
    lifts.reduce((acc, lift) => {
      const liftDate = new Date(lift.lift_date);
      if (liftDate >= weekAgoDate) {
        const userId = lift.member_id;
        const key = `${userId}-${lift.exercise}`;
        
        if (!acc[key]) {
          acc[key] = {
            userId,
            userName: lift.member_name,
            exercise: lift.exercise,
            maxWeight: lift.weight_lbs,
            previousMax: 0
          };
        } else {
          if (lift.weight_lbs > acc[key].maxWeight) {
            acc[key].previousMax = acc[key].maxWeight;
            acc[key].maxWeight = lift.weight_lbs;
          }
        }
      }
      return acc;
    }, {})
  ).map(item => ({
    userId: item.userId,
    userName: item.userName,
    exercise: item.exercise,
    increase: item.maxWeight - item.previousMax
  }))
  .filter(item => item.increase > 0)
  .sort((a, b) => b.increase - a.increase)
  .slice(0, 10);

  if (gymLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gym...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
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
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {isGhostGym && !isGymOwner && (
              <Button
                onClick={() => window.location.href = createPageUrl('InviteOwner') + `?id=${gymId}`}
                variant="ghost"
                size="sm"
                className="bg-purple-500/90 backdrop-blur hover:bg-purple-600 rounded-full text-xs text-white"
              >
                <Crown className="w-4 h-4 mr-1" />
                Make Official
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

          {/* Gym Info Overlay - Top Left */}
          <div className="absolute top-0 left-0 right-0 px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col gap-3 mb-4 pr-32">
                {/* Gym Name & Info */}
                <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className={`font-black text-white drop-shadow-lg break-words ${gym.name.length > 30 ? 'text-lg md:text-xl' : gym.name.length > 20 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
                    {gym.name}
                  </h1>
                  {gym.verified && <BadgeCheck className="w-5 md:w-6 h-5 md:h-6 text-white drop-shadow-lg flex-shrink-0" />}
                </div>
                <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1 drop-shadow-md">
                  <MapPin className="w-3 h-3" />
                  {gym.city}
                </p>
                </div>
              </div>
            </div>
          </div>

          {/* Member Count - Bottom Left */}
          <div className="absolute bottom-3 left-4">
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/30 rounded-full px-3 py-1.5 shadow-2xl shadow-black/30">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white">{gym?.members_count || 0}</span>
                <span className="text-xs text-white/70">members</span>
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
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-yellow-400 rounded-none h-full text-slate-400 hover:text-slate-300 transition-colors border-0 shadow-none"
            >
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-bold">Challenges</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex-1 data-[state=active]:bg-transparent data-[state=active]:text-purple-400 rounded-none h-full text-slate-400 hover:text-slate-300 transition-colors border-0 shadow-none"
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
        <TabsContent value="home" className="space-y-2 md:space-y-3 mt-0 w-full overflow-hidden" asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="space-y-2 md:space-y-3"
          >
          {/* Ghost Gym Join Prompt */}
          {isGhostGym && !isMember && !showOwnerControls && (
            <Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-xl border border-purple-400/50 p-4 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Join this gym community</p>
                  <p className="text-xs text-slate-300">Start checking in and connecting with members</p>
                </div>
                <Button
                  onClick={() => joinGhostGymMutation.mutate()}
                  disabled={joinGhostGymMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl whitespace-nowrap"
                >
                  {joinGhostGymMutation.isPending ? 'Joining...' : 'Join Gym'}
                </Button>
              </div>
            </Card>
          )}

          {/* Check-in Section */}
          {!showOwnerControls && isMember && <CheckInButton gym={gym} />}

          {/* Polls Section */}
          {polls.length > 0 && (
            <div className="space-y-3">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  onVote={!showOwnerControls && !poll.voters?.includes(currentUser?.id) ? (optionId) => votePollMutation.mutate({ pollId: poll.id, optionId }) : null}
                  userVoted={poll.voters?.includes(currentUser?.id)}
                  isLoading={votePollMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Busy Times Chart */}
          <BusyTimesChart checkIns={checkIns} />

          {/* Community Leaderboard Section */}
          <Card className="bg-gradient-to-br from-slate-900/65 via-slate-900/55 to-slate-950/65 backdrop-blur-3xl border border-white/30 p-3 md:p-5 shadow-2xl shadow-black/30 transition-all duration-300">
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
                  className={`rounded-2xl whitespace-nowrap text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 font-semibold ${
                    leaderboardView === 'checkins' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' : 'bg-black border-slate-600 text-slate-300'
                  }`}
                >
                  <CheckCircle className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
                  <span className="hidden sm:inline">Weekly </span>Check-ins
                </Button>
                <Button
                  variant={leaderboardView === 'streaks' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardView('streaks')}
                  size="sm"
                  className={`rounded-2xl whitespace-nowrap text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 font-semibold ${
                    leaderboardView === 'streaks' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0' : 'bg-black border-slate-600 text-slate-300'
                  }`}
                >
                  <Flame className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
                  Streaks
                </Button>
                <Button
                  variant={leaderboardView === 'progress' ? 'default' : 'outline'}
                  onClick={() => setLeaderboardView('progress')}
                  size="sm"
                  className={`rounded-2xl whitespace-nowrap text-xs md:text-sm px-2 md:px-3 h-7 md:h-9 font-semibold ${
                    leaderboardView === 'progress' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0' : 'bg-black border-slate-600 text-slate-300'
                  }`}
                >
                  <TrendingUp className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
                  Progress
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
                  {checkInLeaderboard.slice(0, 3).map((member, idx) => (
                    <div key={member.userId} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 transition-all backdrop-blur-xl ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/20' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50 shadow-lg shadow-gray-400/20' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20' :
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

            {leaderboardView === 'streaks' && (
              streakLeaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <Flame className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400 text-sm">No streaks yet</p>
                </div>
              ) : (
                <div className="space-y-1.5 md:space-y-2">
                  {streakLeaderboard.slice(0, 3).map((member, idx) => (
                    <div key={member.userId} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 transition-all backdrop-blur-xl ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/20' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50 shadow-lg shadow-gray-400/20' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20' :
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

            {leaderboardView === 'progress' && (
              progressLeaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400 text-sm">No progress this week yet</p>
                </div>
              ) : (
                <div className="space-y-1.5 md:space-y-2">
                  {progressLeaderboard.slice(0, 3).map((member, idx) => (
                    <div key={`${member.userId}-${member.exercise}`} className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-xl border-2 transition-all backdrop-blur-xl ${
                      idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50 shadow-lg shadow-yellow-500/20' :
                      idx === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50 shadow-lg shadow-gray-400/20' :
                      idx === 2 ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20' :
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
                        <p className="text-xs text-slate-300">{member.exercise.replace('_', ' ')} • +{member.increase}kg</p>
                      </div>
                      <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-cyan-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
           <Card className="bg-slate-900/60 backdrop-blur-3xl border border-white/30 p-3 md:p-4 shadow-2xl shadow-black/30">
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
            <Card className="bg-slate-900/60 backdrop-blur-3xl border border-white/30 p-3 md:p-4 shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm md:text-base font-bold text-slate-100">New Challenges</h3>
              </div>
              <div className="space-y-2">
                {gymChallenges.slice(0, 1).map((challenge) => (
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



        </motion.div>
        </TabsContent>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-3 mt-0 w-full overflow-hidden" asChild>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="space-y-3"
        >
          {/* Upcoming Events This Week */}
          {upcomingEvents.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-white">📅 This Week</h2>
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
            <Card className="p-8 text-center bg-gradient-to-br from-blue-950/40 via-slate-900/40 to-blue-900/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-blue-400/50" />
              <p className="text-white font-semibold mb-1">No community posts yet</p>
              <p className="text-sm text-slate-300">Be the first to share your workout! 💪</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 10).map((post) => (
                <GymPostCard key={post.id} post={post} gym={gym} isOwner={showOwnerControls} />
              ))}
            </div>
          )}
          </motion.div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-2 md:space-y-4 mt-0 w-full overflow-hidden" asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="space-y-2 md:space-y-4"
          >
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
            <div className="space-y-3">
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

          </motion.div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-2 md:space-y-3 mt-0 w-full overflow-hidden" asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="space-y-2 md:space-y-3"
          >
          {/* Classes Section */}
          <Card className="bg-gradient-to-br from-slate-900/65 via-slate-900/55 to-slate-950/65 backdrop-blur-3xl border border-white/30 p-2 md:p-5 shadow-2xl shadow-black/30">
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
              <div className="p-4 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
                <Calendar className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                <p className="text-slate-400 text-xs">No classes scheduled</p>
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
          <Card className="bg-gradient-to-br from-slate-900/65 via-slate-900/55 to-slate-950/65 backdrop-blur-3xl border border-white/30 p-2 md:p-5 shadow-2xl shadow-black/30">
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
              <div className="p-4 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
                <Calendar className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                <p className="text-slate-400 text-xs">No upcoming events</p>
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
          <Card className="bg-gradient-to-br from-slate-900/65 via-slate-900/55 to-slate-950/65 backdrop-blur-3xl border border-white/30 p-2 md:p-5 shadow-2xl shadow-black/30">
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
              <div className="p-4 text-center border-2 border-dashed border-slate-600/50 rounded-2xl">
                <GraduationCap className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                <p className="text-slate-400 text-xs">No coaches listed</p>
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
          </motion.div>
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