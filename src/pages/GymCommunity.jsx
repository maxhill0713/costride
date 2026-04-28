import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Tab sub-components
import GymCommunityHero from '../components/gym/GymCommunityHero';
import GymCommunityHome from '../components/gym/GymCommunityHome';
import GymCommunityActivity from '../components/gym/GymCommunityActivity';
import GymCommunityClasses from '../components/gym/GymCommunityClasses';
import GymCommunityChallenges from '../components/gym/GymCommunityChallenges';

// Modals
import CreateEventModal from '../components/events/CreateEventModal';
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';
import ManageRewardsModal from '../components/gym/ManageRewardsModal';
import ManageClassesModal from '../components/gym/ManageClassesModal';
import ManageCoachesModal from '../components/gym/ManageCoachesModal';
import ManageGymPhotosModal from '../components/gym/ManageGymPhotosModal';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import EditGymLogoModal from '../components/gym/EditGymLogoModal';
import ManageMembersModal from '../components/gym/ManageMembersModal';
import InviteOwnerModal from '../components/gym/InviteOwnerModal';
import CoachProfileModal from '../components/gym/CoachProfileModal';
import ClassBookedModal from '../components/gym/ClassBookedModal';
import UpgradeMembershipModal from '../components/membership/UpgradeMembershipModal';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';
import PullToRefresh from '../components/PullToRefresh';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)'
};

const DIALOG_ANIM = `
  @keyframes gcDialogIn {
    0%   { transform: translate(-50%, calc(-50% + 22px)) scale(0.93); opacity: 0; }
    65%  { transform: translate(-50%, calc(-50% - 3px))  scale(1.01); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.0);               opacity: 1; }
  }
  [role="dialog"][data-state="open"] { animation: gcDialogIn 280ms cubic-bezier(0.25,0.46,0.45,0.94) forwards !important; }
`;

export default function GymCommunity() {
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = 'gym-community-dialog-anim';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id; tag.textContent = DIALOG_ANIM;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.addEventListener('focus', () => queryClient.invalidateQueries({ queryKey: ['gymActivityFeed', gymId] }));
  }, [gymId]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('class_booked') ? 'classes' : 'home');
  const [leaderboardView, setLeaderboardView] = useState('checkins');
  const [viewAsMember, setViewAsMember] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [showBookedModal, setShowBookedModal] = useState(false);
  const [displayedClass, setDisplayedClass] = useState(null);

  // Modal visibility
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showManageEquipment, setShowManageEquipment] = useState(false);
  const [showManageRewards, setShowManageRewards] = useState(false);
  const [showManageClasses, setShowManageClasses] = useState(false);
  const [showManageCoaches, setShowManageCoaches] = useState(false);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const [showEditHeroImage, setShowEditHeroImage] = useState(false);
  const [showEditGymLogo, setShowEditGymLogo] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [showInviteOwnerModal, setShowInviteOwnerModal] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 });
  const { data: gym, isLoading: gymLoading } = useQuery({ queryKey: ['gym', gymId], queryFn: () => base44.entities.Gym.filter({ id: gymId }).then((r) => r[0]), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: members = [] } = useQuery({ queryKey: ['members', gymId], queryFn: () => base44.entities.GymMember.filter({ gym_id: gymId }, 'user_name', 200), enabled: !!gymId, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', gymId], queryFn: () => base44.entities.Coach.filter({ gym_id: gymId }, 'name', 20), enabled: !!gymId, staleTime: 10 * 60 * 1000, gcTime: 20 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: gymActivityData = {} } = useQuery({ queryKey: ['gymActivityFeed', gymId], queryFn: () => base44.functions.invoke('getGymActivityFeed', { gymId }).then((r) => r.data), enabled: !!gymId, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: gymMembership } = useQuery({ queryKey: ['gymMembership', currentUser?.id, gymId], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, gym_id: gymId, status: 'active' }).then((r) => r[0]), enabled: !!currentUser && !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: claimedBonuses = [] } = useQuery({ queryKey: ['claimedBonuses', currentUser?.id, gymId], queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser.id, gym_id: gymId }, '-created_date', 100), enabled: !!currentUser && !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: challengeParticipants = [] } = useQuery({ queryKey: ['challengeParticipants', currentUser?.id], queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id }, '-created_date', 50), enabled: !!currentUser, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });
  const { data: leaderboards = {} } = useQuery({ queryKey: ['leaderboards', gymId], queryFn: () => base44.functions.invoke('getGymLeaderboards', { gymId }).then((r) => r.data), enabled: !!gymId, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000 });
  const { data: allGyms = [] } = useQuery({ queryKey: ['gyms'], queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 50), enabled: showCreateChallenge, staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 });
  const { data: gymChallengeParticipants = [] } = useQuery({ queryKey: ['gymChallengeParticipants', gymId], queryFn: async () => { const ids = challenges.map((c) => c.id); if (!ids.length) return []; return base44.entities.ChallengeParticipant.filter({ challenge_id: ids[0] }, '-created_date', 100); }, enabled: !!gymId && activeTab === 'activity' && challenges.length > 0, staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000, placeholderData: (prev) => prev });

  // ── Derived data ──────────────────────────────────────────────────────────
  const checkIns = gymActivityData.checkIns || [];
  const events = gymActivityData.events || [];
  const classes = gymActivityData.classes || [];
  const rewards = gymActivityData.rewards || [];
  const challenges = gymActivityData.challenges || [];
  const polls = gymActivityData.polls || [];
  const gymWorkoutLogs = gymActivityData.workoutLogs || [];
  const gymAchievements = gymActivityData.achievements || [];
  const backendMemberAvatars = gymActivityData.memberAvatars || {};
  const backendMemberNames = gymActivityData.memberNames || {};
  const gymChallenges = challenges.filter((c) => c.status === 'active' || c.status === 'upcoming');
  const gymPostsRaw = gymActivityData.posts || [];
  const gymPosts = gymPostsRaw.slice(0, postsPage * 20);
  const hasMorePosts = gymPostsRaw.length > postsPage * 20;

  const memberAvatarMap = React.useMemo(() => {
    const map = { ...backendMemberAvatars };
    members.forEach((m) => { if (!m.user_id) return; const avatar = m.avatar_url || m.user_avatar || m.profile_picture || null; if (avatar && !map[m.user_id]) map[m.user_id] = avatar; });
    if (currentUser?.id) { const myAvatar = currentUser.avatar_url || currentUser.profile_picture || currentUser.photo_url || null; if (myAvatar) map[currentUser.id] = myAvatar; }
    return map;
  }, [backendMemberAvatars, members, currentUser]);

  const memberNameMap = React.useMemo(() => {
    const map = { ...backendMemberNames };
    if (currentUser?.id) map[currentUser.id] = currentUser.display_name || currentUser.full_name || null;
    return map;
  }, [backendMemberNames, currentUser]);

  const isGymOwner = currentUser && gym && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';
  const isGhostGym = gym && !gym.admin_id && !gym.owner_email;
  const isCoach = !!(currentUser && coaches.find((c) => c.user_email === currentUser.email));
  const showOwnerControls = isGymOwner && !viewAsMember;
  const isMember = !!gymMembership || isGymOwner;

  // Auto-show booked modal after Stripe payment redirect
  const bookedClassId = new URLSearchParams(window.location.search).get('class_booked');
  const foundBookedClass = bookedClassId ? (classes.find(c => c.id === bookedClassId) || null) : null;
  useEffect(() => { if (foundBookedClass && !displayedClass) { setDisplayedClass(foundBookedClass); setShowBookedModal(true); } }, [foundBookedClass?.id]);

  // Track recently viewed gyms
  useEffect(() => {
    if (!gymId || !currentUser?.id) return;
    try {
      const key = `recentlyViewedGyms_${currentUser.id}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([gymId, ...prev.filter((id) => id !== gymId)].slice(0, 3)));
    } catch {}
  }, [gymId, currentUser?.id]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createEventMutation = useMutation({ mutationFn: (eventData) => base44.entities.Event.create({ ...eventData, gym_id: gymId, gym_name: gym?.name, attendees: 0 }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events', gymId] }); setShowCreateEvent(false); } });
  const updateEquipmentMutation = useMutation({ mutationFn: (equipment) => base44.entities.Gym.update(gymId, { equipment }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowManageEquipment(false); } });
  const createRewardMutation = useMutation({ mutationFn: (rewardData) => base44.entities.Reward.create(rewardData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const deleteRewardMutation = useMutation({ mutationFn: (rewardId) => base44.entities.Reward.delete(rewardId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rewards', gymId] }); } });
  const createClassMutation = useMutation({ mutationFn: (classData) => base44.entities.GymClass.create(classData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const updateClassMutation = useMutation({ mutationFn: ({ classId, data }) => base44.entities.GymClass.update(classId, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const deleteClassMutation = useMutation({ mutationFn: (classId) => base44.entities.GymClass.delete(classId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes', gymId] }); } });
  const createCoachMutation = useMutation({ mutationFn: (coachData) => base44.entities.Coach.create(coachData), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const deleteCoachMutation = useMutation({ mutationFn: (coachId) => base44.entities.Coach.delete(coachId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const updateCoachMutation = useMutation({ mutationFn: ({ coachId, data }) => base44.entities.Coach.update(coachId, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coaches', gymId] }); } });
  const deleteChallengeMutation = useMutation({ mutationFn: (challengeId) => base44.entities.Challenge.delete(challengeId), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); } });
  const createChallengeMutation = useMutation({ mutationFn: (challengeData) => base44.entities.Challenge.create({ ...challengeData, gym_id: gymId, gym_name: gym?.name }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['challenges', gymId] }); setShowCreateChallenge(false); } });
  const updateGalleryMutation = useMutation({ mutationFn: (gallery) => base44.entities.Gym.update(gymId, { gallery }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowManagePhotos(false); } });
  const updateHeroImageMutation = useMutation({ mutationFn: (image_url) => base44.entities.Gym.update(gymId, { image_url }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowEditHeroImage(false); } });
  const updateGymLogoMutation = useMutation({ mutationFn: (logo_url) => base44.entities.Gym.update(gymId, { logo_url }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); setShowEditGymLogo(false); } });
  const banMemberMutation = useMutation({ mutationFn: (userId) => base44.entities.Gym.update(gymId, { banned_members: [...(gym?.banned_members || []), userId] }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); } });
  const unbanMemberMutation = useMutation({ mutationFn: (userId) => base44.entities.Gym.update(gymId, { banned_members: (gym?.banned_members || []).filter((id) => id !== userId) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gym', gymId] }); } });
  const joinGhostGymMutation = useMutation({
    mutationFn: async () => {
      const currentMemberships = await base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' });
      if (currentMemberships.length >= 3) throw new Error('You can only be a member of up to 3 gyms.');
      await base44.entities.GymMembership.create({ user_id: currentUser.id, user_name: currentUser.full_name, user_email: currentUser.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime' });
      if (!currentUser.primary_gym_id) await base44.auth.updateMe({ primary_gym_id: gym.id });
    },
    onSuccess: () => {
      queryClient.setQueryData(['gymMemberships', currentUser?.id], (old = []) => [...(old || []), { gym_id: gym.id, gym_name: gym.name, user_id: currentUser?.id, status: 'active' }]);
      queryClient.invalidateQueries({ queryKey: ['gymMembership', currentUser?.id, gymId] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });
  const joinChallengeMutation = useMutation({
    mutationFn: async (challenge) => { await base44.functions.invoke('joinChallenge', { challengeId: challenge.id }); },
    onMutate: async (challenge) => {
      await queryClient.cancelQueries({ queryKey: ['challengeParticipants', currentUser?.id] });
      const previous = queryClient.getQueryData(['challengeParticipants', currentUser?.id]);
      queryClient.setQueryData(['challengeParticipants', currentUser?.id], (old = []) => [...old, { id: `temp-${challenge.id}`, user_id: currentUser.id, challenge_id: challenge.id, challenge_title: challenge.title, progress: 0, completed: false }]);
      return { previous };
    },
    onError: (err, challenge, context) => { queryClient.setQueryData(['challengeParticipants', currentUser?.id], context.previous); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeParticipants', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['challenges', gymId] });
      base44.entities.Notification.create({ user_id: currentUser.id, type: 'challenge', title: '💪 Challenge Joined!', message: 'Good luck on your new challenge!', icon: '🎯' });
    }
  });
  const votePollMutation = useMutation({
    mutationFn: async ({ pollId, optionId }) => {
      const poll = polls.find((p) => p.id === pollId);
      await base44.entities.Poll.update(pollId, { options: poll.options.map((opt) => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt), voters: [...(poll.voters || []), currentUser.id] });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['polls', gymId] }); }
  });

  if (gymLoading && !gym) return null;
  if (!gymLoading && !gym) return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex items-center justify-center p-4">
      <div className="p-8 text-center rounded-2xl" style={CARD_STYLE}>
        <p className="text-slate-400 mb-4">Gym not found</p>
        <Link to={createPageUrl('Gyms')} className="text-blue-400 font-bold">Back to Gyms</Link>
      </div>
    </div>
  );

  return (
    <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.some((k) => k === gymId) }); }}>
      <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-x-hidden">

          <GymCommunityHero
            gym={gym}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isGymOwner={isGymOwner}
            isMember={isMember}
            isGhostGym={isGhostGym}
            viewAsMember={viewAsMember}
            setViewAsMember={setViewAsMember}
            isCoach={isCoach}
            onEditHero={() => setShowEditHeroImage(true)}
            onMakeOfficial={() => setShowInviteOwnerModal(true)}
            onJoinGym={() => joinGhostGymMutation.mutate()}
            isJoining={joinGhostGymMutation.isPending}
          />

          <div className="max-w-4xl mx-auto px-3 md:px-4 pt-3 pb-28 space-y-3 w-full overflow-hidden">

            <TabsContent value="home" className="space-y-3 mt-0 w-full" asChild>
              <div>
                <GymCommunityHome
                  checkIns={checkIns}
                  events={events}
                  coaches={coaches}
                  leaderboardView={leaderboardView}
                  setLeaderboardView={setLeaderboardView}
                  leaderboards={leaderboards}
                  memberAvatarMap={memberAvatarMap}
                  showOwnerControls={showOwnerControls}
                  onManageCoaches={() => setShowManageCoaches(true)}
                  onCoachSelect={setSelectedCoach}
                  gymId={gymId}
                  gym={gym}
                  isMember={isMember}
                  currentUser={currentUser}
                />
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-3 mt-0 w-full" asChild>
              <div>
                <GymCommunityActivity
                  checkIns={checkIns}
                  memberAvatarMap={memberAvatarMap}
                  memberNameMap={memberNameMap}
                  workoutLogs={gymWorkoutLogs}
                  challengeParticipants={gymChallengeParticipants}
                  challenges={challenges}
                  achievements={gymAchievements}
                  posts={gymPosts}
                  hasMorePosts={hasMorePosts}
                  onLoadMore={() => setPostsPage((p) => p + 1)}
                  polls={polls}
                  currentUser={currentUser}
                  showOwnerControls={showOwnerControls}
                  onVotePoll={(args) => votePollMutation.mutate(args)}
                />
              </div>
            </TabsContent>

            <TabsContent value="challenges" className="space-y-3 mt-0 w-full" asChild>
              <div>
                <GymCommunityChallenges
                  isGhostGym={isGhostGym}
                  showOwnerControls={showOwnerControls}
                  onCreateChallenge={() => setShowCreateChallenge(true)}
                  gymChallenges={gymChallenges}
                  challengeParticipants={challengeParticipants}
                  currentUser={currentUser}
                  onJoinChallenge={(c) => joinChallengeMutation.mutate(c)}
                  onDeleteChallenge={(id) => deleteChallengeMutation.mutate(id)}
                  gym={gym}
                  memberAvatarMap={memberAvatarMap}
                  memberNameMap={memberNameMap}
                />
              </div>
            </TabsContent>

            <TabsContent value="classes" className="space-y-3 mt-0 w-full">
              <GymCommunityClasses
                isGhostGym={isGhostGym}
                classes={classes}
                showOwnerControls={showOwnerControls}
                onManage={() => setShowManageClasses(true)}
                onDelete={(id) => deleteClassMutation.mutate(id)}
                currentUser={currentUser}
                gymId={gymId}
                autoOpenClassId={new URLSearchParams(window.location.search).get('class_booked')}
              />
            </TabsContent>

          </div>
        </Tabs>

        {/* ── Modals ── */}
        <CreateEventModal open={showCreateEvent} onClose={() => setShowCreateEvent(false)} onSave={(data) => createEventMutation.mutate(data)} gym={gym} isLoading={createEventMutation.isPending} />
        <ManageEquipmentModal open={showManageEquipment} onClose={() => setShowManageEquipment(false)} equipment={gym?.equipment || []} onSave={(equipment) => updateEquipmentMutation.mutate(equipment)} isLoading={updateEquipmentMutation.isPending} />
        <ManageRewardsModal open={showManageRewards} onClose={() => setShowManageRewards(false)} rewards={rewards} onCreateReward={(data) => createRewardMutation.mutate(data)} onDeleteReward={(id) => deleteRewardMutation.mutate(id)} gym={gym} isLoading={createRewardMutation.isPending} />
        <ManageClassesModal open={showManageClasses} onClose={() => setShowManageClasses(false)} classes={classes} onCreateClass={(data) => createClassMutation.mutate(data)} onUpdateClass={(classId, data) => updateClassMutation.mutate({ classId, data })} onDeleteClass={(id) => deleteClassMutation.mutate(id)} gym={gym} isLoading={createClassMutation.isPending || updateClassMutation.isPending} />
        <ManageCoachesModal open={showManageCoaches} onClose={() => setShowManageCoaches(false)} coaches={coaches} onCreateCoach={(data) => createCoachMutation.mutate(data)} onDeleteCoach={(id) => deleteCoachMutation.mutate(id)} onUpdateCoach={(coachId, data) => updateCoachMutation.mutate({ coachId, data })} gym={gym} isLoading={createCoachMutation.isPending} />
        <ManageGymPhotosModal open={showManagePhotos} onClose={() => setShowManagePhotos(false)} gallery={gym?.gallery || []} onSave={(gallery) => updateGalleryMutation.mutate(gallery)} isLoading={updateGalleryMutation.isPending} />
        <EditHeroImageModal open={showEditHeroImage} onClose={() => setShowEditHeroImage(false)} currentImageUrl={gym?.image_url} onSave={(image_url) => updateHeroImageMutation.mutate(image_url)} isLoading={updateHeroImageMutation.isPending} />
        <EditGymLogoModal open={showEditGymLogo} onClose={() => setShowEditGymLogo(false)} currentLogoUrl={gym?.logo_url} onSave={(logo_url) => updateGymLogoMutation.mutate(logo_url)} isLoading={updateGymLogoMutation.isPending} />
        <ManageMembersModal open={showManageMembers} onClose={() => setShowManageMembers(false)} gym={gym} onBanMember={(userId) => banMemberMutation.mutate(userId)} onUnbanMember={(userId) => unbanMemberMutation.mutate(userId)} />
        <UpgradeMembershipModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} currentUser={currentUser} />
        <CreateChallengeModal open={showCreateChallenge} onClose={() => setShowCreateChallenge(false)} gyms={allGyms} onSave={(data) => createChallengeMutation.mutate(data)} isLoading={createChallengeMutation.isPending} />
        <InviteOwnerModal isOpen={showInviteOwnerModal} onClose={() => setShowInviteOwnerModal(false)} gym={gym} currentUser={currentUser} />
        <CoachProfileModal coach={selectedCoach} open={!!selectedCoach} onClose={() => setSelectedCoach(null)} gymClasses={classes} />
        <ClassBookedModal open={showBookedModal && !!displayedClass} onClose={() => { setShowBookedModal(false); setDisplayedClass(null); }} gymClass={displayedClass} gymName={gym?.name} />
      </div>
    </PullToRefresh>
  );
}