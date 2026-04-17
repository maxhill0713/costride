import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Filter, Gift, BadgeCheck, Edit, Heart, Images, Plus, Search, Building2, Loader2, Crown, CheckCircle, X, MoreVertical, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import ExplorePanel from '../components/gym/ExplorePanel';
import MyGymsContent from '../components/gym/MyGymsContent';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const PRIMARY_GYM_DIALOG_STYLES = `
  @keyframes pgDialogIn {
    0%   { transform: translate(-50%, calc(-50% + 20px)) scale(0.95); opacity: 0; }
    65%  { transform: translate(-50%, calc(-50% - 3px))  scale(1.01); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.0);               opacity: 1; }
  }
  @keyframes pgDialogOut {
    0%   { transform: translate(-50%, -50%) scale(1.0);  opacity: 1; }
    100% { transform: translate(-50%, calc(-50% + 14px)) scale(0.95); opacity: 0; }
  }
  @keyframes pgItemIn {
    0%   { transform: translateY(10px); opacity: 0; }
    65%  { transform: translateY(-2px); opacity: 1; }
    100% { transform: translateY(0);    opacity: 1; }
  }
  [data-primary-gym-dialog][data-state="open"]   { animation: pgDialogIn  320ms cubic-bezier(0.25,0.46,0.45,0.94) forwards !important; }
  [data-primary-gym-dialog][data-state="closed"] { animation: pgDialogOut 200ms cubic-bezier(0.4,0,1,1) forwards !important; }
  .pg-item-in { opacity: 0; animation: pgItemIn 360ms cubic-bezier(0.22,1,0.36,1) forwards; }
`;

function usePrimaryGymDialogStyles() {
  useEffect(() => {
    const id = 'primary-gym-dialog-anim';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = PRIMARY_GYM_DIALOG_STYLES;
      document.head.appendChild(tag);
    }
  }, []);
}

const sanitiseGymSearch = (v) => v.replace(/[<>{};`\\]/g, '').slice(0, 60);

export default function Gyms() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [editingGym, setEditingGym] = useState(null);
  const [showJoinWithCode, setShowJoinWithCode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [savedGyms, setSavedGyms] = useState([]);
  const [equipmentGym, setEquipmentGym] = useState(null);
  const [galleryGym, setGalleryGym] = useState(null);
  const [placesResults, setPlacesResults] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [showAddGymModal, setShowAddGymModal] = useState(false);
  const [selectedPlaceGym, setSelectedPlaceGym] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [gymType, setGymType] = useState('general');
  const [showPrimaryGymModal, setShowPrimaryGymModal] = useState(false);
  const [selectedPrimaryGym, setSelectedPrimaryGym] = useState(null);
  const [confirmLeaveGym, setConfirmLeaveGym] = useState(null);
  const [showConfirmJoin, setShowConfirmJoin] = useState(false);
  const [pendingGymData, setPendingGymData] = useState(null);
  const queryClient = useQueryClient();

  const prefetchGymData = (gymId) => {
    queryClient.prefetchQuery({ queryKey: ['gym', gymId], queryFn: () => base44.entities.Gym.filter({ id: gymId }).then(r => r[0]), staleTime: 5 * 60 * 1000 });
    queryClient.prefetchQuery({ queryKey: ['gymActivityFeed', gymId], queryFn: () => base44.functions.invoke('getGymActivityFeed', { gymId }).then(r => r.data), staleTime: 2 * 60 * 1000 });
    queryClient.prefetchQuery({ queryKey: ['leaderboards', gymId], queryFn: () => base44.functions.invoke('getGymLeaderboards', { gymId }).then(r => r.data), staleTime: 5 * 60 * 1000 });
  };

  usePrimaryGymDialogStyles();

  useEffect(() => {
    document.body.style.backgroundColor = '#02040a';
    document.documentElement.style.backgroundColor = '#02040a';
    return () => { document.body.style.backgroundColor = ''; document.documentElement.style.backgroundColor = ''; };
  }, []);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me().catch(() => null), staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 });
  useEffect(() => { if (currentUser && !currentUser.onboarding_completed) navigate(createPageUrl('Onboarding')); }, [currentUser, navigate]);
  React.useEffect(() => { const p = new URLSearchParams(window.location.search); if (p.get('joinCode') && currentUser) setShowJoinWithCode(true); }, [currentUser]);

  const { data: gymMemberships = [] } = useQuery({ queryKey: ['gymMemberships', currentUser?.id], queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }), enabled: !!currentUser?.id, staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, placeholderData: p => p });
  const { data: gyms = [] } = useQuery({ queryKey: ['gyms'], queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 100), staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000, placeholderData: p => p });

  const recentlyViewedGymIds = useMemo(() => {
    if (!currentUser?.id) return [];
    try { return JSON.parse(localStorage.getItem(`recentlyViewedGyms_${currentUser.id}`) || '[]').slice(0, 3); } catch { return []; }
  }, [currentUser?.id]);

  const memberGymIds = gymMemberships.map(m => m.gym_id);
  const { data: userGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: () => memberGymIds.length === 0 ? [] : base44.entities.Gym.filter({ id: { $in: memberGymIds } }),
    enabled: !!currentUser && gymMemberships.length > 0, staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000, placeholderData: p => p,
  });

  const updateGymImageMutation = useMutation({
    mutationFn: ({ gymId, image_url }) => base44.entities.Gym.update(gymId, { image_url }),
    onMutate: async ({ gymId, image_url }) => {
      await queryClient.cancelQueries({ queryKey: ['gyms'] });
      const previous = queryClient.getQueryData(['gyms']);
      queryClient.setQueryData(['gyms'], (old = []) => old.map(g => g.id === gymId ? { ...g, image_url } : g));
      return { previous };
    },
    onError: (err, v, ctx) => { if (ctx?.previous) queryClient.setQueryData(['gyms'], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyms'] }); queryClient.invalidateQueries({ queryKey: ['memberGyms'] }); setEditingGym(null); },
  });

  const updatePrimaryGymMutation = useMutation({
    mutationFn: gymId => base44.auth.updateMe({ primary_gym_id: gymId }),
    onMutate: async gymId => {
      const previous = queryClient.getQueryData(['currentUser']);
      queryClient.setQueryData(['currentUser'], old => old ? { ...old, primary_gym_id: gymId } : old);
      return { previous };
    },
    onError: (err, gymId, ctx) => queryClient.setQueryData(['currentUser'], ctx.previous),
    onSuccess: () => { setShowPrimaryGymModal(false); setSelectedPrimaryGym(null); },
  });

  const leaveGymMutation = useMutation({
    mutationFn: async gymId => {
      const m = await base44.entities.GymMembership.filter({ gym_id: gymId, user_id: currentUser?.id });
      if (m.length > 0) await base44.entities.GymMembership.delete(m[0].id);
    },
    onMutate: async gymId => {
      await queryClient.cancelQueries({ queryKey: ['gymMemberships', currentUser?.id] });
      const previous = queryClient.getQueryData(['gymMemberships', currentUser?.id]);
      queryClient.setQueryData(['gymMemberships', currentUser?.id], (old = []) => old.filter(m => m.gym_id !== gymId));
      return { previous };
    },
    onError: (err, gymId, ctx) => queryClient.setQueryData(['gymMemberships', currentUser?.id], ctx.previous),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] }); queryClient.invalidateQueries({ queryKey: ['memberGyms', currentUser?.id] }); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); },
  });

  const createGymMutation = useMutation({
    mutationFn: async gymData => {
      const existing = await base44.entities.Gym.filter({ google_place_id: gymData.google_place_id });
      if (existing.length > 0) return { exists: true, gym: existing[0] };
      return { exists: false, gym: await base44.entities.Gym.create(gymData) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      queryClient.invalidateQueries({ queryKey: ['memberGyms', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setShowAddGymModal(false); setShowConfirmJoin(false); setSelectedPlaceGym(null); setPendingGymData(null); setPlacesResults([]); setSearchQuery('');
    },
  });

  const userGyms = [...userGymsData].sort((a, b) => {
    if (a.id === currentUser?.primary_gym_id) return -1;
    if (b.id === currentUser?.primary_gym_id) return 1;
    return 0;
  });

  const recentlyViewedGyms = useMemo(() => recentlyViewedGymIds.map(id => gyms.find(g => g.id === id)).filter(Boolean).slice(0, 3), [recentlyViewedGymIds, gyms]);

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) || gym.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || gym.type === selectedType;
    const matchesDistance = maxDistance === 'all' || (gym.distance_km && gym.distance_km <= parseFloat(maxDistance));
    const matchesEquipment = selectedEquipment === 'all' || (gym.equipment && gym.equipment.includes(selectedEquipment));
    const isGhostOrApproved = gym.status === 'approved' || (!gym.admin_id && !gym.owner_email);
    return matchesSearch && matchesType && matchesDistance && matchesEquipment && isGhostOrApproved;
  });

  const inAppSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return gyms.filter(gym =>
      !memberGymIds.includes(gym.id) &&
      (gym.name?.toLowerCase().includes(q) || gym.city?.toLowerCase().includes(q))
    );
  }, [searchQuery, gyms, memberGymIds]);

  const toggleSave = gymId => setSavedGyms(prev => prev.includes(gymId) ? prev.filter(id => id !== gymId) : [...prev, gymId]);

  const searchPlaces = async query => {
    const safe = query.trim();
    if (!safe || safe.length < 2) { setPlacesResults([]); return; }
    setSearchingPlaces(true);
    try {
      const response = await base44.functions.invoke('searchGymsPlaces', { input: safe });
      const results = response.data.results || [];
      const existingPlaceIds = gyms.map(g => g.google_place_id).filter(Boolean);
      setPlacesResults(results.filter(p => !existingPlaceIds.includes(p.place_id)));
    } catch { setPlacesResults([]); } finally { setSearchingPlaces(false); }
  };

  const handleSelectPlace = place => { setSelectedPlaceGym(place); setShowAddGymModal(true); };

  const handleCreateGym = async () => {
    if (!selectedPlaceGym) return;
    if (gymMemberships.length >= 3 && !isOwner) { alert('You can only be a member of up to 3 gyms.'); return; }
    if (!isOwner) {
      const ghost = gyms.filter(g => g.created_by === currentUser?.email && !g.admin_id && !g.owner_email);
      if (ghost.length >= 3) { alert('You have reached the limit of 3 ghost gyms.'); return; }
    }
    const parts = selectedPlaceGym.address.split(',');
    const city = parts.length >= 2 ? parts[parts.length - 2].trim() : selectedPlaceGym.address;
    const gymData = { name: selectedPlaceGym.name, address: selectedPlaceGym.address, city, google_place_id: selectedPlaceGym.place_id, latitude: selectedPlaceGym.latitude, longitude: selectedPlaceGym.longitude, type: gymType, claim_status: isOwner ? 'claimed' : 'unclaimed', admin_id: isOwner ? currentUser?.id : null, owner_email: isOwner ? currentUser?.email : null, verified: isOwner, status: 'approved', members_count: 0, image_url: selectedPlaceGym.photo_url || null };
    if (isOwner && gymMemberships.length > 0) { setPendingGymData(gymData); setShowConfirmJoin(true); } else { createGymMutation.mutate(gymData); }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchPlaces(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, gyms]);

  // ── Shared gym card ──
  const GymCardInner = ({ gym, isMember = false }) => (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-300 group" style={{ background: 'linear-gradient(135deg,rgba(30,35,60,0.72) 0%,rgba(8,10,20,0.88) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.1) 50%,transparent 90%)' }} />
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
        {gym.image_url
          ? <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
          : <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center"><div className="text-slate-500 text-center"><Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-60" /><p className="text-xs font-medium opacity-60">No photo</p></div></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} onMouseEnter={() => prefetchGymData(gym.id)} onMouseDown={() => prefetchGymData(gym.id)} className="absolute inset-0 flex items-center justify-center">
          <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent text-xs h-8 px-3 shadow-[0_3px_0_0_#1a3fa8,inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
            <Dumbbell className="w-3 h-3 mr-1.5" />Enter Gym
          </Button>
        </Link>
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {(gym.claim_status === 'claimed' || gym.admin_id || gym.owner_email)
            ? <Badge className="bg-green-500 text-white text-xs shadow-lg font-semibold"><BadgeCheck className="w-3 h-3 mr-1" />Official</Badge>
            : isMember ? <Badge className="bg-slate-700/95 text-slate-200 text-xs shadow-lg font-semibold border-transparent">Unofficial</Badge> : null
          }
          {isMember && currentUser && currentUser.email === gym.owner_email &&
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs shadow-lg font-bold">Owner</Badge>
          }
        </div>
        {isMember && currentUser?.primary_gym_id === gym.id &&
          <div className="absolute bottom-3 left-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-purple-500/50">
              <Star className="w-5 h-5 text-white" />
            </div>
          </div>
        }
        <div className="absolute top-3 right-3 flex gap-3">
          <button onClick={e => { e.preventDefault(); setGalleryGym(gym); }} className="flex items-center justify-center hover:scale-110 transition-all"><Images className="w-5 h-5 text-slate-400 drop-shadow-lg" /></button>
          <button onClick={e => { e.preventDefault(); setEquipmentGym(gym); }} className="flex items-center justify-center hover:scale-110 transition-all"><Dumbbell className="w-5 h-5 text-slate-400 drop-shadow-lg" /></button>
          {isMember ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={e => e.preventDefault()} className="flex items-center justify-center hover:scale-110 transition-all"><MoreVertical className="w-5 h-5 text-slate-400 drop-shadow-lg" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl">
                {currentUser && currentUser.email === gym.owner_email &&
                  <DropdownMenuItem onClick={e => { e.preventDefault(); setEditingGym(gym); }} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"><Edit className="w-4 h-4 mr-2" />Edit Gym</DropdownMenuItem>
                }
                <DropdownMenuItem onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirmLeaveGym(gym); }} disabled={leaveGymMutation.isPending} className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer"><LogOut className="w-4 h-4 mr-2" />Leave Gym</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            currentUser && currentUser.email === gym.owner_email &&
              <button onClick={() => setEditingGym(gym)} className="flex items-center justify-center hover:scale-110 transition-all"><Edit className="w-5 h-5 text-slate-400 drop-shadow-lg" /></button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div>
          <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400"><MapPin className="w-4 h-4 flex-shrink-0" /><span className="line-clamp-1">{gym.address || gym.city}</span></div>
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
          {gym.rating > 0 && <div className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold text-white text-sm">{gym.rating}/5</span></div>}
          {gym.members_count > 0 && <div className="flex items-center gap-1.5 text-sm text-slate-400"><Users className="w-4 h-4" /><span className="font-semibold">{gym.members_count}</span></div>}
        </div>
        {gym.type && <div className="flex justify-center pt-1"><Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">{gym.type}</Badge></div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right,#02040a,#0d2360,#02040a)' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(to bottom right,#02040a,#0d2360,#02040a)' }} />

      <Tabs defaultValue="my-gyms" className="w-full">

        {/* ── Fixed header ── */}
        <div
          className="fixed top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4"
          style={{ paddingTop: 'calc(0.4rem + env(safe-area-inset-top))', paddingBottom: 0 }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="relative flex items-end justify-center h-[3.2rem] pt-2 pb-2">
              <TabsList className="flex bg-transparent p-0 gap-9 border-0 h-auto mb-[-1px]">
                <TabsTrigger value="my-gyms" className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 pb-2 pt-0 transition-colors bg-transparent text-[16.5px] justify-center leading-none">
                  <Users className="w-4 h-4 mr-1.5" />My Gyms
                </TabsTrigger>
                <TabsTrigger value="explore" className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 pb-2 pt-0 transition-colors bg-transparent text-[16.5px] justify-center leading-none">
                  <MapPin className="w-4 h-4 mr-1.5" />Explore
                </TabsTrigger>
              </TabsList>

              {/* Right buttons — My Gyms tab */}
              <TabsContent value="my-gyms" className="absolute right-0 bottom-3.5 mt-0 p-0 m-0 flex items-center">
                {userGyms.length > 0 &&
                  <Button onClick={() => setShowPrimaryGymModal(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent rounded-md text-[10px] h-6 px-1.5 shadow-[0_2px_0_0_#5b21b6,inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[2px] active:scale-95 transform-gpu">
                    Set Home
                  </Button>
                }
              </TabsContent>

              {/* Right buttons — Explore tab */}
              <TabsContent value="explore" className="absolute right-0 bottom-3.5 mt-0 p-0 m-0 flex items-center gap-2">
                {userGyms.length === 0 &&
                  <Button onClick={() => setShowJoinWithCode(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent rounded-md text-[10px] h-6 px-1.5 shadow-[0_2px_0_0_#5b21b6,inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[2px] active:scale-95 transform-gpu">
                    Join Gym
                  </Button>
                }
                <Button onClick={() => setShowJoinWithCode(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent rounded-md text-[10px] h-6 px-1.5 shadow-[0_2px_0_0_#1a3fa8,inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[2px] active:scale-95 transform-gpu">
                  Gym Key
                </Button>
              </TabsContent>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: '3.6rem' }} />

        {/* ── My Gyms ── */}
        <TabsContent value="my-gyms" className="mt-0 px-3 md:px-4 pt-4 pb-32">
          <MyGymsContent userGyms={userGyms} GymCardInner={GymCardInner} />
        </TabsContent>

        {/* ── Explore ── */}
        <TabsContent value="explore" className="mt-0 px-3 md:px-4 pt-4 pb-32 !overflow-visible">
          <div className="max-w-6xl mx-auto">
            {/* Search bar + filter — always visible */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Search gyms or add new..." value={searchQuery} onChange={e => setSearchQuery(sanitiseGymSearch(e.target.value))} maxLength={60} autoComplete="off" autoCorrect="off" spellCheck="false" style={{ fontSize: '16px' }} className="h-9 pl-10 pr-10 bg-white/10 border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-white/15 text-white placeholder:text-slate-300 rounded-xl transition-all duration-200 w-full" />
                {searchingPlaces && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />}
              </div>
              <button onClick={() => setShowFilterModal(true)} className="relative flex-shrink-0 w-11 h-9 rounded-xl flex items-center justify-center border transition-all bg-white/10 border-white/20 hover:border-white/40 text-slate-400">
                <Filter className="w-5 h-5" />
                {(selectedType !== 'all' || maxDistance !== 'all' || selectedEquipment !== 'all') && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />}
              </button>
            </div>

            {/* Search results — inline, pushes content down */}
            {searchingPlaces && searchQuery.length >= 2 &&
              <div className="rounded-xl p-3 space-y-2 bg-slate-800/90 border border-slate-700/50 animate-pulse mb-4">
                <div className="h-4 w-40 bg-slate-700/60 rounded-lg" />
                <div className="space-y-2">
                  <div className="rounded-xl bg-slate-700/50 border border-slate-600/40 overflow-hidden flex items-stretch"><div className="w-20 h-20 flex-shrink-0 bg-slate-600/60" /><div className="flex-1 p-3 flex flex-col justify-center gap-2"><div className="h-4 bg-slate-600/60 rounded w-3/4" /><div className="h-3 bg-slate-600/40 rounded w-1/2" /></div></div>
                  <div className="rounded-xl bg-slate-700/50 border border-slate-600/40 overflow-hidden flex items-stretch"><div className="w-20 h-20 flex-shrink-0 bg-slate-600/60" /><div className="flex-1 p-3 flex flex-col justify-center gap-2"><div className="h-4 bg-slate-600/60 rounded w-3/4" /><div className="h-3 bg-slate-600/40 rounded w-1/2" /></div></div>
                  <div className="rounded-xl bg-slate-700/50 border border-slate-600/40 overflow-hidden flex items-stretch"><div className="w-20 h-20 flex-shrink-0 bg-slate-600/60" /><div className="flex-1 p-3 flex flex-col justify-center gap-2"><div className="h-4 bg-slate-600/60 rounded w-3/4" /><div className="h-3 bg-slate-600/40 rounded w-1/2" /></div></div>
                </div>
              </div>
            }

            {!searchingPlaces && searchQuery.length >= 2 && placesResults.length > 0 &&
              <div className="rounded-xl p-3 space-y-2 bg-slate-900/95 border border-slate-800/60 shadow-xl mb-4">
                <p className="text-xs font-semibold flex items-center gap-2"><Plus className="w-3 h-3 text-green-400" /><span className="text-green-400">Found {placesResults.length} gyms on Google Places</span></p>
                <div className="space-y-2">
                  {placesResults.slice(0, 5).map(place => (
                    <div key={place.place_id} className="rounded-xl bg-slate-700/50 border border-slate-600/40 overflow-hidden">
                      <div className="flex items-stretch">
                        <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-slate-600 to-slate-700 overflow-hidden">
                          {place.photo_url ? <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Dumbbell className="w-6 h-6 text-slate-500" /></div>}
                        </div>
                        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                          <h4 className="font-semibold text-white text-sm mb-0.5 truncate">{place.name}</h4>
                          <div className="flex items-center gap-1 text-slate-400 text-xs"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{place.address}</span></div>
                          {place.rating && <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-slate-300 text-xs">{place.rating}</span></div>}
                        </div>
                        <div className="flex items-center pr-3">
                          <button onClick={() => handleSelectPlace(place)} className="bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white border-transparent shadow-[0_3px_0_0_#065f46] active:shadow-none active:translate-y-[2px] active:scale-95 transform-gpu text-xs font-bold px-2.5 py-1 rounded-lg">Add</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }

            {/* In-app gym search results */}
            {!searchingPlaces && searchQuery.length >= 2 && inAppSearchResults.length > 0 &&
              <div className="rounded-xl p-3 space-y-2 bg-slate-900/95 border border-slate-800/60 shadow-xl mb-4">
                <p className="text-xs font-semibold flex items-center gap-2"><Building2 className="w-3 h-3 text-blue-400" /><span className="text-blue-400">Found {inAppSearchResults.length} gym{inAppSearchResults.length > 1 ? 's' : ''} on CoStride</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inAppSearchResults.slice(0, 6).map(gym => (
                    <div key={gym.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <GymCardInner gym={gym} isMember={false} />
                    </div>
                  ))}
                </div>
              </div>
            }

            {/* ExplorePanel — always rendered, always visible */}
            {(() => {
              const primaryGym = userGyms.find(g => g.id === currentUser?.primary_gym_id) || userGyms[0];
              const nearbyGyms = primaryGym?.latitude && primaryGym?.longitude
                ? gyms
                    .filter(g => !memberGymIds.includes(g.id) && g.latitude && g.longitude)
                    .map(g => {
                      const dLat = (g.latitude - primaryGym.latitude) * Math.PI / 180;
                      const dLon = (g.longitude - primaryGym.longitude) * Math.PI / 180;
                      const a = Math.sin(dLat/2)**2 + Math.cos(primaryGym.latitude * Math.PI/180) * Math.cos(g.latitude * Math.PI/180) * Math.sin(dLon/2)**2;
                      const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                      return { ...g, _dist: dist };
                    })
                    .filter(g => g._dist <= 20)
                    .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
                    .slice(0, 3)
                : [];

              return (
                <ExplorePanel
                  recentlyViewedGyms={recentlyViewedGyms}
                  nearbyGyms={nearbyGyms}
                  GymCardInner={GymCardInner}
                />
              );
            })()}

          </div>
        </TabsContent>
      </Tabs>

      {/* ── Modals ── */}
      <EditHeroImageModal open={!!editingGym} onClose={() => setEditingGym(null)} currentImageUrl={editingGym?.image_url} onSave={image_url => updateGymImageMutation.mutate({ gymId: editingGym.id, image_url })} isLoading={updateGymImageMutation.isPending} />
      <JoinWithCodeModal open={showJoinWithCode} onClose={() => setShowJoinWithCode(false)} currentUser={currentUser} gymCount={userGyms.length} />

      <Dialog open={!!equipmentGym} onOpenChange={() => setEquipmentGym(null)}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 max-w-lg max-h-[80vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
          <DialogHeader><DialogTitle className="text-lg font-bold text-center">Equipment</DialogTitle></DialogHeader>
          {equipmentGym?.equipment?.length > 0
            ? <div className="grid grid-cols-2 gap-2">{equipmentGym.equipment.map((item, i) => <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-lg border border-slate-700/50"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /><span className="text-slate-200 text-sm">{item}</span></div>)}</div>
            : <div className="text-center py-8 text-slate-400"><Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No equipment information available</p></div>
          }
        </DialogContent>
      </Dialog>

      <Dialog open={!!galleryGym} onOpenChange={() => setGalleryGym(null)}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 max-w-4xl max-h-[110vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
          {galleryGym?.gallery?.length > 0
            ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{galleryGym.gallery.map((url, i) => <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-700/50 border border-slate-600/50"><img src={url} alt={`${galleryGym.name} ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" loading="lazy" /></div>)}</div>
            : <div className="text-center py-12 text-slate-400"><Images className="w-16 h-16 mx-auto mb-3 opacity-50" /><p>No photos available</p></div>
          }
        </DialogContent>
      </Dialog>

      <Dialog open={showPrimaryGymModal} onOpenChange={setShowPrimaryGymModal}>
        <DialogContent data-primary-gym-dialog className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 max-w-lg max-h-[80vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 pg-item-in" style={{ animationDelay: '60ms' }}>
              <Star className="w-5 h-5 text-purple-400" />Set Primary Gym
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3 pg-item-in" style={{ animationDelay: '100ms' }}>
              <p className="text-purple-200 text-sm">Your primary gym is the default community shown on the Home page.</p>
            </div>
            <div className="space-y-2">
              {userGyms.map((gym, i) => {
                const isPrimary = selectedPrimaryGym === gym.id || (!selectedPrimaryGym && currentUser?.primary_gym_id === gym.id);
                return (
                  <button key={gym.id} onClick={() => setSelectedPrimaryGym(gym.id)} className={`pg-item-in w-full text-left p-4 rounded-xl border-2 transition-all ${isPrimary ? 'bg-purple-500/20 border-purple-400/50' : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-400/30'}`} style={{ animationDelay: `${140 + i * 55}ms` }}>
                    <div className="flex items-center justify-between">
                      <div><h4 className="font-bold text-white">{gym.name}</h4><p className="text-xs text-slate-400">{gym.city}</p></div>
                      {isPrimary && <Badge className="bg-purple-500 text-white"><Star className="w-3 h-3 mr-1" />Primary</Badge>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pg-item-in" style={{ animationDelay: `${140 + userGyms.length * 55}ms` }}>
              <Button onClick={() => { setShowPrimaryGymModal(false); setSelectedPrimaryGym(null); }} className="flex-1 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 text-white border border-slate-500/40 rounded-lg h-9 font-bold shadow-[0_3px_0_0_#1e293b,inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">Cancel</Button>
              <Button onClick={() => { if (selectedPrimaryGym) updatePrimaryGymMutation.mutate(selectedPrimaryGym); else { setShowPrimaryGymModal(false); setSelectedPrimaryGym(null); } }} disabled={updatePrimaryGymMutation.isPending} className="flex-1 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent rounded-lg h-9 font-bold shadow-[0_3px_0_0_#5b21b6,inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
                {updatePrimaryGymMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmJoin} onOpenChange={() => { setShowConfirmJoin(false); setPendingGymData(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md [&>button]:hidden">
          <DialogHeader><DialogTitle className="text-xl font-bold">{gymMemberships.length > 0 ? 'Replace Primary Gym?' : 'Join This Community?'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">{gymMemberships.length > 0 ? <>You're currently a member of <span className="font-semibold text-white">{gymMemberships[0]?.gym_name}</span>. Joining <span className="font-semibold text-white">{selectedPlaceGym?.name}</span> will replace your primary gym.</> : <>Are you sure you want to join <span className="font-semibold text-white">{selectedPlaceGym?.name}</span>? This is an unclaimed community gym.</>}</p>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => { setShowConfirmJoin(false); setPendingGymData(null); }} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Button>
              <Button onClick={() => pendingGymData && createGymMutation.mutate(pendingGymData)} disabled={createGymMutation.isPending} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500">
                {createGymMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {confirmLeaveGym && (
        <>
          <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={() => setConfirmLeaveGym(null)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[360px] z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
            <h3 className="text-xl font-black text-white mb-2">Leave {confirmLeaveGym.name}?</h3>
            <p className="text-slate-300 text-sm mb-6">Are you sure you want to leave this gym? You'll lose access to its community.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLeaveGym(null)} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                Cancel
              </button>
              <button onClick={() => { leaveGymMutation.mutate(confirmLeaveGym.id); setConfirmLeaveGym(null); }} disabled={leaveGymMutation.isPending} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50">
                {leaveGymMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Leave Gym'}
              </button>
            </div>
          </div>
        </>
      )}

      {showFilterModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
          <div className="fixed bottom-24 left-0 right-0 z-50 bg-slate-800/30 backdrop-blur-md border-t border-slate-700/20 rounded-3xl p-5 space-y-2 shadow-2xl shadow-black/20" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white text-center absolute left-1/2 -translate-x-1/2">Filters</h3>
              {(selectedType !== 'all' || maxDistance !== 'all' || selectedEquipment !== 'all') && <button onClick={() => { setSelectedType('all'); setMaxDistance('all'); setSelectedEquipment('all'); }} className="text-xs text-blue-400 font-semibold ml-auto">Clear all</button>}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Gym Type</label>
                <div className="flex flex-wrap gap-2">{[['all','All Types'],['powerlifting','Powerlifting'],['bodybuilding','Bodybuilding'],['crossfit','CrossFit'],['boxing','Boxing'],['mma','MMA'],['general','General']].map(([val,label]) => <button key={val} onClick={() => setSelectedType(val)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${selectedType===val?'bg-blue-600 text-white':'bg-slate-700/60 text-slate-300 hover:bg-slate-700'}`}>{label}</button>)}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Distance</label>
                <div className="flex flex-wrap gap-2">{[['all','Any'],['5','5 km'],['10','10 km'],['20','20 km'],['50','50 km']].map(([val,label]) => <button key={val} onClick={() => setMaxDistance(val)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${maxDistance===val?'bg-blue-600 text-white':'bg-slate-700/60 text-slate-300 hover:bg-slate-700'}`}>{label}</button>)}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Equipment</label>
                <div className="flex flex-wrap gap-2">{[['all','All'],['Power Racks','Power Racks'],['Barbells','Barbells'],['Dumbbells','Dumbbells'],['Cable Machines','Cables'],['Cardio Equipment','Cardio'],['Olympic Platforms','Olympic']].map(([val,label]) => <button key={val} onClick={() => setSelectedEquipment(val)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${selectedEquipment===val?'bg-blue-600 text-white':'bg-slate-700/60 text-slate-300 hover:bg-slate-700'}`}>{label}</button>)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={showAddGymModal} onOpenChange={() => { setShowAddGymModal(false); setSelectedPlaceGym(null); setIsOwner(false); setGymType('general'); }}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 max-w-lg max-h-[80vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
          <DialogHeader><DialogTitle className="text-xl font-bold">Add Gym to CoStride</DialogTitle></DialogHeader>
          {selectedPlaceGym && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0"><Building2 className="w-6 h-6 text-white" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">{selectedPlaceGym.name}</h3>
                    <div className="flex items-start gap-2 text-slate-300 text-sm mb-2"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{selectedPlaceGym.address}</span></div>
                    {selectedPlaceGym.rating && <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="text-slate-300 text-sm">{selectedPlaceGym.rating} rating</span></div>}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Gym Type</label>
                <Select value={gymType} onValueChange={setGymType}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Fitness</SelectItem><SelectItem value="powerlifting">Powerlifting</SelectItem><SelectItem value="bodybuilding">Bodybuilding</SelectItem><SelectItem value="crossfit">CrossFit</SelectItem><SelectItem value="boxing">Boxing</SelectItem><SelectItem value="mma">MMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {currentUser?.account_type === 'gym_owner' && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-xl p-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={isOwner} onChange={e => setIsOwner(e.target.checked)} className="mt-1 w-5 h-5 rounded border-purple-400 text-purple-600 focus:ring-purple-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><span className="text-white font-semibold text-sm">I am the owner/manager of this gym</span><Crown className="w-4 h-4 text-purple-400" /></div>
                      <p className="text-slate-300 text-xs">Check this if you own or manage this gym.</p>
                    </div>
                  </label>
                </div>
              )}
              <Button onClick={handleCreateGym} disabled={createGymMutation.isPending} className="w-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white rounded-xl font-bold py-6 text-base shadow-[0_4px_0_0_#065f46,inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-[0.98] transform-gpu">
                {createGymMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                {isOwner ? 'Claim & Add Gym' : 'Add Gym'}
              </Button>
              {isOwner && <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3"><p className="text-blue-300 text-xs text-center">✓ Your gym will be marked as verified and you'll become the admin</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}