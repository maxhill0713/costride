import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Trophy, TrendingUp, MessageCircle, Heart, BadgeCheck, Gift, ChevronLeft, Calendar, Plus, Edit, GraduationCap, Clock, Target, Award, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PostCard from '../components/feed/PostCard';
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

export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showManageEquipment, setShowManageEquipment] = useState(false);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [showLogLift, setShowLogLift] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showEditHeroImage, setShowEditHeroImage] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [viewAsMember, setViewAsMember] = useState(false);

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

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts', gymId],
    queryFn: async () => {
      const allLifts = await base44.entities.Lift.list('-weight_lbs');
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

  const createLiftMutation = useMutation({
    mutationFn: (liftData) => base44.entities.Lift.create(liftData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifts', gymId] });
      setShowLogLift(false);
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
  const showOwnerControls = isGymOwner && !viewAsMember;

  // Filter lifts by exercise
  const filteredLifts = selectedExercise === 'all' 
    ? lifts 
    : lifts.filter(l => l.exercise === selectedExercise);

  // Get best lift per member for selected exercise
  const bestLiftsPerMember = filteredLifts.reduce((acc, lift) => {
    const key = lift.member_id;
    if (!acc[key] || lift.weight_lbs > acc[key].weight_lbs) {
      acc[key] = lift;
    }
    return acc;
  }, {});

  const topLifts = Object.values(bestLiftsPerMember)
    .sort((a, b) => b.weight_lbs - a.weight_lbs)
    .slice(0, 10)
    .map(lift => {
      const member = members.find(m => m.id === lift.member_id);
      return { ...lift, member };
    });

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
      {/* Hero Section */}
      <div className="relative">
        {gym.image_url ? (
          <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-cyan-500">
            <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-cyan-500"></div>
        )}
        
        <Link to={createPageUrl('Gyms')} className="absolute top-4 left-4">
          <Button variant="ghost" className="bg-white/90 backdrop-blur hover:bg-white rounded-full">
            <ChevronLeft className="w-5 h-5" />
            </Button>
            </Link>

            {isGymOwner && (
            <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={() => setViewAsMember(!viewAsMember)}
              variant="ghost"
              className={`bg-white/90 backdrop-blur hover:bg-white rounded-full ${viewAsMember ? 'ring-2 ring-blue-500' : ''}`}
            >
              {viewAsMember ? '👤 Member View' : '👑 Owner View'}
            </Button>
            {!viewAsMember && (
              <Button
                onClick={() => setShowEditHeroImage(true)}
                variant="ghost"
                className="bg-white/90 backdrop-blur hover:bg-white rounded-full"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            </div>
            )}

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-semibold">{gym.name}</h1>
                  {gym.verified && (
                    <BadgeCheck className="w-6 h-6 text-green-400" />
                  )}
                </div>
                <p className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  {gym.address || gym.city}
                </p>
              </div>
              {gym.price && (
                <div className="text-right bg-white/20 backdrop-blur px-4 py-2 rounded-2xl">
                  <div className="text-2xl font-black">£{gym.price}</div>
                  <div className="text-xs">/month</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-semibold text-gray-900">{gym.members_count || 0}</span>
            </div>
            <p className="text-sm font-normal text-gray-600">Members</p>
            </Card>
            <Card className="p-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-semibold text-gray-900">{gym.rating || 0}</span>
            </div>
            <p className="text-sm font-normal text-gray-600">Rating</p>
            </Card>
            <Card className="p-4 text-center bg-white">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-semibold text-gray-900">{lifts.length}</span>
            </div>
            <p className="text-sm text-gray-600">PRs</p>
          </Card>
        </div>

        {/* Reward Offer */}
        {gym.reward_offer && (
          <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-orange-900 text-lg">{gym.reward_offer}</p>
                  <p className="text-sm font-normal text-orange-700 leading-relaxed">Special offer for new members!</p>
                </div>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl">
                Claim Offer
              </Button>
            </div>
          </Card>
        )}

        {/* Check-in Section */}
        <CheckInButton gym={gym} />

        {/* Rewards Section */}
        {rewards.filter(r => r.active).length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-purple-900">Member Rewards</h3>
                  <p className="text-sm font-normal text-purple-700 leading-relaxed">Earn rewards for your dedication!</p>
                </div>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rewards.filter(r => r.active).slice(0, 4).map((reward) => {
                const hasUserClaimed = reward.claimed_by?.includes(currentUser?.id);
                return (
                  <Card key={reward.id} className="p-4 bg-white border-2 border-purple-200">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{reward.icon || '🎁'}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{reward.title}</h4>
                        {reward.description && (
                          <p className="text-xs font-normal text-gray-600 mt-1 leading-relaxed">{reward.description}</p>
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
                  </Card>
                );
              })}
            </div>
          </Card>
        )}

        {/* Manage Rewards Button for Gym Owners */}
        {showOwnerControls && rewards.filter(r => r.active).length === 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 p-6 mb-6">
            <div className="text-center">
              <Gift className="w-12 h-12 mx-auto mb-3 text-purple-500" />
              <h3 className="font-semibold text-gray-900 mb-2">Create Member Rewards</h3>
              <p className="text-sm font-normal text-gray-600 mb-4 leading-relaxed">
                Motivate your members with rewards for check-ins, streaks, and achievements!
              </p>
              <Button
                onClick={() => setShowManageRewards(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Rewards
              </Button>
            </div>
          </Card>
        )}

        {/* Manage Members - Gym Owners Only */}
        {showOwnerControls && (
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900">Member Management</h3>
                  <p className="text-sm font-normal text-blue-700 leading-relaxed">View and manage your gym members</p>
                </div>
              </div>
              <Button
                onClick={() => setShowManageMembers(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl"
              >
                Manage Members
              </Button>
            </div>
          </Card>
        )}

        {/* Leaderboard Rewards */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-900">Leaderboard Rewards</h3>
              <p className="text-sm font-normal text-purple-700 leading-relaxed">Compete and win exclusive rewards!</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-black text-white">1</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">1st Place</p>
                <p className="text-sm font-normal text-gray-600 leading-relaxed">Free month membership + £50 sports voucher</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-300 rounded-2xl">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center font-black text-white">2</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">2nd Place</p>
                <p className="text-sm font-normal text-gray-600 leading-relaxed">50% off membership + £25 sports voucher</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 border-2 border-orange-300 rounded-2xl">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center font-black text-white">3</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">3rd Place</p>
                <p className="text-sm font-normal text-gray-600 leading-relaxed">25% off membership + £10 sports voucher</p>
              </div>
            </div>
          </div>
        </Card>



        {/* Gym Photos Gallery */}
        {(gym.gallery && gym.gallery.length > 0) || isGymOwner ? (
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-gray-200 p-6 rounded-3xl mb-6">
...
          </Card>
        ) : null}

        {/* Leaderboard Section */}
        <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 rounded-3xl shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">Gym Leaderboard</h3>
                <p className="text-sm font-normal text-slate-300 leading-relaxed">Top performers this month</p>
              </div>
            </div>
          </div>

          {currentUser && (
            <Button
              onClick={() => setShowLogLift(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl mb-4"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Log Your Lift
            </Button>
          )}

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Button
              variant={selectedExercise === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedExercise('all')}
              className="rounded-2xl whitespace-nowrap"
            >
              All Exercises
            </Button>
            <Button
              variant={selectedExercise === 'bench_press' ? 'default' : 'outline'}
              onClick={() => setSelectedExercise('bench_press')}
              className="rounded-2xl whitespace-nowrap"
            >
              Bench Press
            </Button>
            <Button
              variant={selectedExercise === 'squat' ? 'default' : 'outline'}
              onClick={() => setSelectedExercise('squat')}
              className="rounded-2xl whitespace-nowrap"
            >
              Squat
            </Button>
            <Button
              variant={selectedExercise === 'deadlift' ? 'default' : 'outline'}
              onClick={() => setSelectedExercise('deadlift')}
              className="rounded-2xl whitespace-nowrap"
            >
              Deadlift
            </Button>
            <Button
              variant={selectedExercise === 'overhead_press' ? 'default' : 'outline'}
              onClick={() => setSelectedExercise('overhead_press')}
              className="rounded-2xl whitespace-nowrap"
            >
              Overhead Press
            </Button>
          </div>

          <div className="space-y-3">
            {topLifts.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-600/50 rounded-2xl bg-slate-700/50">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No lifts recorded yet</p>
              </div>
            ) : (
              topLifts.map((lift, idx) => (
                <LeaderboardCard
                  key={lift.id}
                  rank={idx + 1}
                  member={lift.member}
                  lift={lift}
                />
              ))
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="challenges" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 bg-white border-2 border-gray-100 p-1 rounded-2xl overflow-x-auto">
            <TabsTrigger value="challenges" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="classes" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Classes
            </TabsTrigger>
            <TabsTrigger value="coaches" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Coaches
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Events
            </TabsTrigger>
            <TabsTrigger value="feed" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Feed
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-xl font-semibold data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges">
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 p-6">
                <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-orange-600" />
                  Gym Challenges
                </h3>
                <p className="text-gray-600 mb-4">
                  Create challenges for your members or challenge other gyms to compete!
                </p>
                <Link to={createPageUrl('Challenges')}>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-2xl">
                    View All Challenges
                  </Button>
                </Link>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            {showOwnerControls && (
              <Button
                onClick={() => setShowManageClasses(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Classes
              </Button>
            )}
            {classes.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-gray-300 rounded-3xl">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No classes scheduled yet</p>
                {showOwnerControls ? (
                  <Button
                    onClick={() => setShowManageClasses(true)}
                    variant="outline"
                    className="mt-3"
                  >
                    Add Classes
                  </Button>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Check back soon for upcoming classes</p>
                )}
              </Card>
            ) : (
              classes.map((gymClass) => (
                <Card key={gymClass.id} className="bg-white border-2 border-gray-100 p-5 rounded-3xl hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">{gymClass.name}</h3>
                      <p className="text-sm font-normal text-gray-600 mb-3 leading-relaxed">{gymClass.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className="bg-purple-100 text-purple-700">
                          {gymClass.instructor}
                        </Badge>
                        {gymClass.difficulty && (
                          <Badge className="capitalize" variant="outline">
                            {gymClass.difficulty.replace('_', ' ')}
                          </Badge>
                        )}
                        {gymClass.duration_minutes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {gymClass.duration_minutes} min
                          </Badge>
                        )}
                      </div>
                      {gymClass.schedule && gymClass.schedule.length > 0 && (
                        <div className="space-y-1">
                          {gymClass.schedule.map((slot, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span className="font-medium">{slot.day}</span>
                              <span>•</span>
                              <span>{slot.time}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="coaches" className="space-y-4">
            {showOwnerControls && (
              <Button
                onClick={() => setShowManageCoaches(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl mb-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Manage Coaches
              </Button>
            )}
            {coaches.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-gray-300 rounded-3xl">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No coaches listed yet</p>
                {showOwnerControls ? (
                  <Button
                    onClick={() => setShowManageCoaches(true)}
                    variant="outline"
                    className="mt-3"
                  >
                    Add Coaches
                  </Button>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Stay tuned for our coaching team</p>
                )}
              </Card>
            ) : (
              coaches.map((coach) => (
                <Card key={coach.id} className="bg-white border-2 border-gray-100 p-5 rounded-3xl hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {coach.avatar_url ? (
                        <img src={coach.avatar_url} alt={coach.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {coach.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{coach.name}</h3>
                        {coach.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-bold text-gray-900">{coach.rating}</span>
                          </div>
                        )}
                      </div>
                      {coach.bio && (
                        <p className="text-sm font-normal text-gray-600 mb-3 leading-relaxed">{coach.bio}</p>
                      )}
                      {coach.specialties && coach.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {coach.specialties.map((specialty, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {coach.experience_years && (
                          <span>{coach.experience_years} years experience</span>
                        )}
                        {coach.total_clients > 0 && (
                          <>
                            <span>•</span>
                            <span>{coach.total_clients} clients</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <Button
                onClick={() => setShowCreateEvent(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
            
            {events.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No upcoming events</p>
                <Button
                  onClick={() => setShowCreateEvent(true)}
                  variant="outline"
                  className="mt-2"
                >
                  Create First Event
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
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
          </TabsContent>

          <TabsContent value="feed" className="space-y-4">
            {posts.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No posts yet</p>
              </Card>
            ) : (
              posts.slice(0, 10).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => {}}
                  onComment={() => {}}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="info">
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gym Information</h3>
              
              {gym.type && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Type</p>
                  <Badge className="capitalize text-sm">{gym.type}</Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-500 uppercase">Equipment Available</p>
                  {showOwnerControls && (
                    <Button
                      onClick={() => setShowManageEquipment(true)}
                      size="sm"
                      variant="outline"
                      className="rounded-2xl"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                {gym.equipment && gym.equipment.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {gym.equipment.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-2xl">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <span className="text-sm font-medium text-purple-900 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <p className="text-gray-500 text-sm">No equipment listed yet</p>
                    {showOwnerControls && (
                      <Button
                        onClick={() => setShowManageEquipment(true)}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        Add Equipment
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {gym.amenities && gym.amenities.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-3">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {gym.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gym.address && (
                <div className="mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Location</p>
                  <p className="text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {gym.address}
                  </p>
                  {gym.postcode && (
                    <p className="text-gray-600 text-sm mt-1 ml-6">{gym.postcode}</p>
                  )}
                </div>
              )}

              {gym.distance_km && (
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Distance</p>
                  <p className="text-gray-900">{gym.distance_km} km away</p>
                </div>
              )}
            </Card>
          </TabsContent>
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
          gym={gym}
          isLoading={createCoachMutation.isPending}
        />

        <LogLiftModal
          open={showLogLift}
          onClose={() => setShowLogLift(false)}
          onSuccess={(data) => createLiftMutation.mutate(data)}
          gym={gym}
          currentUser={currentUser}
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
      </div>
    </div>
  );
}