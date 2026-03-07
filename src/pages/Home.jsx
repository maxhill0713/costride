import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Filter, Gift, BadgeCheck, Edit, Key, Heart, Images, Plus, Search, Building2, Loader2, Crown, CheckCircle, X, MoreVertical, LogOut, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser, navigate]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('joinCode');
    if (joinCode && currentUser) {
      setShowJoinWithCode(true);
    }
  }, [currentUser]);

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 100),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const memberGymIds = gymMemberships.map((m) => m.gym_id);
  const { data: userGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: async () => {
      if (memberGymIds.length === 0) return [];
      const results = await Promise.all(
        memberGymIds.map((id) => base44.entities.Gym.filter({ id }).then((r) => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: !!currentUser && gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const updateGymImageMutation = useMutation({
    mutationFn: ({ gymId, image_url }) => base44.entities.Gym.update(gymId, { image_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setEditingGym(null);
    }
  });

  const updatePrimaryGymMutation = useMutation({
    mutationFn: (gymId) => base44.auth.updateMe({ primary_gym_id: gymId }),
    onMutate: async (gymId) => {
      const previous = queryClient.getQueryData(['currentUser']);
      queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, primary_gym_id: gymId } : old);
      return { previous };
    },
    onError: (err, gymId, context) => {
      queryClient.setQueryData(['currentUser'], context.previous);
    },
    onSuccess: () => {
      setShowPrimaryGymModal(false);
      setSelectedPrimaryGym(null);
    }
  });

  const leaveGymMutation = useMutation({
    mutationFn: async (gymId) => {
      const memberships = await base44.entities.GymMembership.filter({ gym_id: gymId, user_id: currentUser?.id });
      if (memberships.length > 0) {
        await base44.entities.GymMembership.delete(memberships[0].id);
      }
    },
    onMutate: async (gymId) => {
      await queryClient.cancelQueries({ queryKey: ['gymMemberships', currentUser?.id] });
      const previous = queryClient.getQueryData(['gymMemberships', currentUser?.id]);
      queryClient.setQueryData(['gymMemberships', currentUser?.id], (old = []) =>
      old.filter((m) => m.gym_id !== gymId)
      );
      return { previous };
    },
    onError: (err, gymId, context) => {
      queryClient.setQueryData(['gymMemberships', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['memberGyms', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const userGyms = [...userGymsData].sort((a, b) => {
    if (a.id === currentUser?.primary_gym_id) return -1;
    if (b.id === currentUser?.primary_gym_id) return 1;
    return 0;
  });

  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch = gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gym.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || gym.type === selectedType;
    const matchesDistance = maxDistance === 'all' || gym.distance_km && gym.distance_km <= parseFloat(maxDistance);
    const matchesEquipment = selectedEquipment === 'all' ||
    gym.equipment && gym.equipment.includes(selectedEquipment);
    const isGhostOrApproved = gym.status === 'approved' || !gym.admin_id && !gym.owner_email;

    return matchesSearch && matchesType && matchesDistance && matchesEquipment && isGhostOrApproved;
  });

  const toggleSave = (gymId) => {
    setSavedGyms((prev) =>
    prev.includes(gymId) ?
    prev.filter((id) => id !== gymId) :
    [...prev, gymId]
    );
  };

  const searchPlaces = async (query) => {
    if (!query.trim() || query.length < 2) {
      setPlacesResults([]);
      return;
    }

    setSearchingPlaces(true);
    try {
      const response = await base44.functions.invoke('searchGymsPlaces', { input: query });
      const results = response.data.results || [];

      // Filter out places that already exist in our database
      const existingPlaceIds = gyms.map((g) => g.google_place_id).filter(Boolean);
      const newPlaces = results.filter((place) => !existingPlaceIds.includes(place.place_id));

      setPlacesResults(newPlaces);
    } catch (error) {
      console.error('Places search failed:', error);
      setPlacesResults([]);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaceGym(place);
    setShowAddGymModal(true);
  };

  const [showConfirmJoin, setShowConfirmJoin] = useState(false);
  const [pendingGymData, setPendingGymData] = useState(null);

  const createGymMutation = useMutation({
    mutationFn: async (gymData) => {
      const existingGyms = await base44.entities.Gym.filter({ google_place_id: gymData.google_place_id });

      if (existingGyms.length > 0) {
        return { exists: true, gym: existingGyms[0] };
      }

      const newGym = await base44.entities.Gym.create(gymData);
      return { exists: false, gym: newGym };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      setShowAddGymModal(false);
      setShowConfirmJoin(false);
      setSelectedPlaceGym(null);
      setPendingGymData(null);
      setPlacesResults([]);
      setSearchQuery('');
    }
  });

  const handleCreateGym = async () => {
    if (!selectedPlaceGym) return;

    if (gymMemberships.length >= 3 && !isOwner) {
      alert('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');
      return;
    }

    if (!isOwner) {
      const userCreatedGhostGyms = gyms.filter((g) =>
      g.created_by === currentUser?.email &&
      !g.admin_id &&
      !g.owner_email
      );

      if (userCreatedGhostGyms.length >= 3) {
        alert('You have reached the limit of 3 ghost gyms you can create. Please claim ownership if you manage this gym.');
        return;
      }
    }

    const addressParts = selectedPlaceGym.address.split(',');
    const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : selectedPlaceGym.address;

    const gymData = {
      name: selectedPlaceGym.name,
      address: selectedPlaceGym.address,
      city: city,
      google_place_id: selectedPlaceGym.place_id,
      latitude: selectedPlaceGym.latitude,
      longitude: selectedPlaceGym.longitude,
      type: gymType,
      claim_status: isOwner ? 'claimed' : 'unclaimed',
      admin_id: isOwner ? currentUser?.id : null,
      owner_email: isOwner ? currentUser?.email : null,
      verified: isOwner,
      status: 'approved',
      members_count: 0,
      image_url: selectedPlaceGym.photo_url || null
    };

    if (isOwner && gymMemberships.length > 0) {
      setPendingGymData(gymData);
      setShowConfirmJoin(true);
    } else {
      createGymMutation.mutate(gymData);
    }
  };

  const handleConfirmJoin = () => {
    if (pendingGymData) {
      createGymMutation.mutate(pendingGymData);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, gyms]);

  const GymCard = ({ gym }) => {
    const isOwner = currentUser && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';

    return (
      <div className="group cursor-pointer">
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-600/40 rounded-2xl overflow-hidden hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(16,42,112,0.4)] transition-all duration-300">
          {/* Image Section */}
          {gym.image_url &&
          <div className="relative w-full h-40 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
              <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              
              {/* Overlay buttons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="w-full px-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-900/50">
                    View Community
                  </Button>
                </Link>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {gym.verified &&
              <Badge className="bg-green-500/90 text-white text-xs border-green-400/50">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
              }
              </div>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                onClick={() => setEquipmentGym(gym)}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-600/50">
                  <Dumbbell className="w-4 h-4 text-slate-200" />
                </button>
                <button
                onClick={() => toggleSave(gym.id)}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-600/50">
                  <Heart className={`w-4 h-4 ${savedGyms.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-slate-200'}`} />
                </button>
                {isOwner &&
              <button
                onClick={() => setEditingGym(gym)}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-600/50">
                    <Edit className="w-4 h-4 text-slate-200" />
                  </button>
              }
              </div>
            </div>
          }

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-white line-clamp-2 drop-shadow-sm">{gym.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-blue-200/70">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{gym.address || gym.city}</span>
              </div>
            </div>

            {/* Type & Distance */}
            <div className="flex items-center gap-2 flex-wrap">
              {gym.type &&
              <Badge className="bg-blue-600/30 text-blue-100 border border-blue-400/30 text-xs capitalize">
                  {gym.type}
                </Badge>
              }
              {gym.distance_km &&
              <Badge className="bg-slate-700/50 text-slate-200 border border-slate-500/50 text-xs">
                  {gym.distance_km} km
                </Badge>
              }
            </div>

            {/* Rating & Members */}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
              {gym.rating > 0 &&
              <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <span className="font-semibold text-slate-100 text-sm">{gym.rating}/5</span>
                </div>
              }
              {gym.members_count > 0 &&
              <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Users className="w-4 h-4 text-blue-300" />
                  <span>{gym.members_count}</span>
                </div>
              }
            </div>

            {/* Reward Offer */}
            {gym.reward_offer &&
            <div className="bg-gradient-to-r from-orange-600/30 to-orange-500/20 border border-orange-500/40 rounded-lg p-2.5 flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-100 line-clamp-1">{gym.reward_offer}</span>
              </div>
            }
          </div>
        </div>
      </div>);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#050b1a,#102a70,#050b1a)]">
      {/* Tabs */}
      <Tabs defaultValue={gymMemberships.length > 0 ? "my-gyms" : "explore"} className="w-full">
        {/* Tab List */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-800/60 to-[#050b1a]/80 backdrop-blur-md border-b border-slate-700/50 px-3 md:px-4 pt-6 pb-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center h-18 gap-6">
              {gymMemberships.length > 0 &&
              <Button
                onClick={() => setShowPrimaryGymModal(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none py-2 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 backdrop-blur-md text-white border border-transparent gap-2 rounded-lg text-xs h-8.5 px-3 shadow-[0_3px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
                  <Star className="w-4 h-4" />
                </Button>
              }
              <TabsList className="flex justify-start bg-transparent p-0 h-10 gap-12 border-0">
                {userGyms.length > 0 &&
                <TabsTrigger
                  value="my-gyms"
                  className="data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-200 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-base drop-shadow-sm">
                    <Users className="w-5 h-5 mr-2" />
                    My Gyms
                  </TabsTrigger>
                }
                <TabsTrigger
                  value="explore"
                  className="data-[state=active]:text-blue-300 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-200 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-base drop-shadow-sm">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={() => setShowJoinWithCode(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent gap-2 rounded-lg text-xs h-8.5 px-3 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
                <Key className="w-4 h-4" />
                <span className="hidden md:inline">Join with Code</span>
              </Button>
            </div>
          </div>
        </div>

        {/* My Gyms Tab */}
        {userGyms.length > 0 &&
        <TabsContent value="my-gyms" className="mt-0 px-3 md:px-4 py-4">
            <div className="max-w-6xl mx-auto">
              {/* Gyms Grid */}
              {userGyms.length === 0 ?
            <div className="text-center py-12">
                  <p className="text-blue-200/50">No gym memberships yet</p>
                </div> :

            <div className="grid md:grid-cols-2 gap-4">
                  {userGyms.map((gym) =>
              <div key={gym.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-[#050b1a]/80 backdrop-blur-xl border border-slate-600/40 rounded-2xl overflow-hidden hover:border-blue-400/50 transition-all duration-300 shadow-2xl shadow-black/30 hover:shadow-[0_0_25px_rgba(16,42,112,0.4)]">
                        {/* Image Section with Overlay */}
                        <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-[#050b1a] overflow-hidden">
                          {gym.image_url &&
                    <img
                      src={gym.image_url}
                      alt={gym.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    }
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050b1a]/90 via-[#050b1a]/30 to-transparent" />
                          
                          {/* Quick Action Button */}
                          <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                            <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold focus-visible:outline-none py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent text-xs h-8 px-3 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                              <Dumbbell className="w-3 h-3 mr-1.5" />
                              Enter Gym
                            </Button>
                          </Link>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                           {gym.claim_status === 'claimed' || gym.admin_id || gym.owner_email ?
                      <Badge className="bg-green-500 text-white text-xs shadow-lg font-semibold border-green-400">
                               <BadgeCheck className="w-3 h-3 mr-1" />
                               Official
                             </Badge> :
                      <Badge className="inline-flex items-center rounded-md border px-2.5 py-0.5 border-slate-500 bg-slate-800/90 text-slate-200 text-xs shadow-lg font-semibold">
                               Unofficial
                             </Badge>
                      }
                           {currentUser && currentUser.email === gym.owner_email &&
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs shadow-lg font-bold border-purple-400/50">
                               Owner
                             </Badge>
                      }
                          </div>

                          {/* Primary Gym Icon - Bottom Left */}
                          {currentUser?.primary_gym_id === gym.id &&
                    <div className="absolute bottom-3 left-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-600/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-purple-400/50 drop-shadow-[0_0_10px_rgba(147,51,234,0.6)]">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                            </div>
                    }

                          {/* Icons: Gallery, Info & More Options */}
                          <div className="absolute top-3 right-3 flex gap-3">
                            <button
                        onClick={(e) => { e.preventDefault(); setGalleryGym(gym); }}
                        className="flex items-center justify-center hover:scale-110 transition-all p-1.5 rounded-full bg-slate-900/50 backdrop-blur-sm border border-white/10">
                              <Images className="w-4 h-4 text-slate-200" />
                            </button>
                            <button
                        onClick={(e) => { e.preventDefault(); setEquipmentGym(gym); }}
                        className="flex items-center justify-center hover:scale-110 transition-all p-1.5 rounded-full bg-slate-900/50 backdrop-blur-sm border border-white/10">
                              <Dumbbell className="w-4 h-4 text-slate-200" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center justify-center hover:scale-110 transition-all p-1.5 rounded-full bg-slate-900/50 backdrop-blur-sm border border-white/10">
                                  <MoreVertical className="w-4 h-4 text-slate-200" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50 min-w-[8rem] bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-lg shadow-xl">
                                {currentUser && currentUser.email === gym.owner_email &&
                          <DropdownMenuItem
                            onClick={(e) => { e.preventDefault(); setEditingGym(gym); }}
                            className="text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Gym
                                  </DropdownMenuItem>
                          }
                                <DropdownMenuItem
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmLeaveGym(gym); }}
                            disabled={leaveGymMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer">
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Leave Gym
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 space-y-2">
                          {/* Header */}
                          <div>
                            <h3 className="text-xl font-black text-white mb-1 line-clamp-1 drop-shadow-sm">{gym.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-blue-200/70">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="line-clamp-1">{gym.address || gym.city}</span>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
                            {gym.rating > 0 &&
                      <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                                <span className="font-bold text-white text-sm">{gym.rating}/5</span>
                              </div>
                      }
                            {gym.members_count > 0 &&
                      <div className="flex items-center gap-1.5 text-sm text-slate-300">
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="font-semibold">{gym.members_count}</span>
                              </div>
                      }
                          </div>

                          {/* Gym Type at Bottom Center */}
                          {gym.type &&
                    <div className="flex justify-center pt-1">
                              <Badge className="bg-gradient-to-r from-blue-600/40 to-purple-600/40 text-blue-100 border border-blue-400/30 text-xs capitalize shadow-sm">
                                {gym.type}
                              </Badge>
                            </div>
                    }
                        </div>
                      </div>
                    </div>
              )}
                </div>
            }
            </div>
          </TabsContent>
        }

        {/* Explore Tab */}
         <TabsContent value="explore" className="mt-0 px-3 md:px-4 py-4">
          <div className="max-w-6xl mx-auto">
            {/* Search & Filters */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search gyms or add new..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)} className="flex w-full px-3 py-1 text-base h-9 pl-10 pr-10 bg-slate-800/50 backdrop-blur-sm border border-slate-600/40 hover:border-blue-400/50 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-slate-800/80 text-white placeholder:text-slate-400 rounded-xl transition-all duration-200 shadow-inner" />

                  {searchingPlaces &&
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]" />
                  }
                </div>
                <button
                  onClick={() => setShowFilterModal(true)} className="relative flex-shrink-0 w-11 h-9 rounded-xl flex items-center justify-center border transition-all bg-slate-800/50 backdrop-blur-sm border-slate-600/40 hover:border-blue-400/50 text-slate-300 hover:text-white shadow-sm">
                  <Filter className="w-5 h-5" />
                  {(selectedType !== 'all' || maxDistance !== 'all' || selectedEquipment !== 'all') &&
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  }
                </button>
              </div>

              {/* Google Places Skeleton / Search Results Placeholder */}
              {searchingPlaces && searchQuery.length >= 2 && (
                <div className="space-y-3 mt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 animate-pulse">
                      <div className="w-16 h-16 rounded-lg bg-slate-700/50" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-slate-700/50 rounded w-3/4" />
                        <div className="h-3 bg-slate-700/50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}