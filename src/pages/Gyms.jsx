import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Filter, Gift, BadgeCheck, Edit, Key, Heart, Images, Plus, Search, Building2, Loader2, Crown, CheckCircle, X, MoreVertical, LogOut } from 'lucide-react';
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

    // Check if user already has 3 gym memberships
    if (gymMemberships.length >= 3 && !isOwner) {
      alert('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');
      return;
    }

    // Check if user is trying to create a ghost gym (not claiming ownership)
    if (!isOwner) {
      // Count how many ghost gyms this user has created
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

    // Only show confirmation when adding an official gym (claiming ownership)
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
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl">
          {/* Image Section */}
          {gym.image_url &&
          <div className="relative w-full h-40 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
              <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              
              {/* Overlay buttons */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="w-full px-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    View Community
                  </Button>
                </Link>
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {gym.verified &&
              <Badge className="bg-green-500/90 text-white text-xs">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
              }
              </div>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                onClick={() => setEquipmentGym(gym)}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-800 transition-colors">

                  <Dumbbell className="w-4 h-4 text-slate-300" />
                </button>
                <button
                onClick={() => toggleSave(gym.id)}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-800 transition-colors">

                  <Heart className={`w-4 h-4 ${savedGyms.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                </button>
                {isOwner &&
              <button
                onClick={() => setEditingGym(gym)}
                className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-800 transition-colors">

                    <Edit className="w-4 h-4 text-slate-300" />
                  </button>
              }
              </div>
            </div>
          }

          {/* Content Section */}
          <div className="p-4 space-y-3">
            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-slate-100 line-clamp-2">{gym.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{gym.address || gym.city}</span>
              </div>
            </div>

            {/* Type & Distance */}
            <div className="flex items-center gap-2 flex-wrap">
              {gym.type &&
              <Badge className="bg-blue-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">
                  {gym.type}
                </Badge>
              }
              {gym.distance_km &&
              <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600/50 text-xs">
                  {gym.distance_km} km
                </Badge>
              }
            </div>

            {/* Rating & Members */}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
              {gym.rating > 0 &&
              <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-slate-100 text-sm">{gym.rating}/5</span>
                </div>
              }
              {gym.members_count > 0 &&
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>{gym.members_count}</span>
                </div>
              }
            </div>

            {/* Reward Offer */}
            {gym.reward_offer &&
            <div className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-2.5 flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-200 line-clamp-1">{gym.reward_offer}</span>
              </div>
            }
          </div>
        </div>
      </div>);

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Tabs */}
      <Tabs defaultValue={gymMemberships.length > 0 ? "my-gyms" : "explore"} className="w-full">
        {/* Tab List */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pt-6 pb-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center h-18 gap-6">
              {gymMemberships.length > 0 &&
              <Button
                onClick={() => setShowPrimaryGymModal(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 backdrop-blur-md text-white border border-transparent gap-2 rounded-lg text-xs h-8.5 px-3 shadow-[0_3px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu\n">


                  <Star className="w-4 h-4" />
                </Button>
              }
              <TabsList className="flex justify-start bg-transparent p-0 h-10 gap-12 border-0">
                {userGyms.length > 0 &&
                <TabsTrigger
                  value="my-gyms"
                  className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-base">

                    <Users className="w-5 h-5 mr-2" />
                    My Gyms
                  </TabsTrigger>
                }
                <TabsTrigger
                  value="explore"
                  className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-base">

                  <MapPin className="w-5 h-5 mr-2" />
                  Explore
                </TabsTrigger>
              </TabsList>
              <Button
                onClick={() => setShowJoinWithCode(true)} className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent gap-2 rounded-lg text-xs h-8.5 px-3 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">


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
                  <p className="text-slate-400">No gym memberships yet</p>
                </div> :

            <div className="grid md:grid-cols-2 gap-4">
                  {userGyms.map((gym) =>
              <div key={gym.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 shadow-2xl shadow-black/20">
                        {/* Image Section with Overlay */}
                        <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          {gym.image_url &&
                    <img
                      src={gym.image_url}
                      alt={gym.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />

                    }
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          
                          {/* Quick Action Button */}
                          <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                            <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent text-xs h-8 px-3 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                              <Dumbbell className="w-3 h-3 mr-1.5" />
                              Enter Gym
                            </Button>
                          </Link>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                           {gym.claim_status === 'claimed' || gym.admin_id || gym.owner_email ?
                      <Badge className="bg-green-500 text-white text-xs shadow-lg font-semibold">
                               <BadgeCheck className="w-3 h-3 mr-1" />
                               Official
                             </Badge> :

                      <Badge className="bg-slate-600/90 text-slate-200 text-xs shadow-lg font-semibold">
                               Unofficial
                             </Badge>
                      }
                           {currentUser && currentUser.email === gym.owner_email &&
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs shadow-lg font-bold">
                               Owner
                             </Badge>
                      }
                          </div>

                          {/* Primary Gym Icon - Bottom Left */}
                          {currentUser?.primary_gym_id === gym.id &&
                    <div className="absolute bottom-3 left-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-600/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-purple-500/50">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                            </div>
                    }

                          {/* Icons: Gallery, Info & More Options */}
                          <div className="absolute top-3 right-3 flex gap-3">
                            <button
                        onClick={(e) => {
                          e.preventDefault();
                          setGalleryGym(gym);
                        }}
                        className="flex items-center justify-center hover:scale-110 transition-all">

                              <Images className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                            </button>
                            <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEquipmentGym(gym);
                        }}
                        className="flex items-center justify-center hover:scale-110 transition-all">

                              <Dumbbell className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center justify-center hover:scale-110 transition-all">

                                  <MoreVertical className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                {currentUser && currentUser.email === gym.owner_email &&
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              setEditingGym(gym);
                            }}
                            className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">

                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Gym
                                  </DropdownMenuItem>
                          }
                                <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmLeaveGym(gym);
                            }}
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
                            <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="line-clamp-1">{gym.address || gym.city}</span>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
                            {gym.rating > 0 &&
                      <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-white text-sm">{gym.rating}/5</span>
                              </div>
                      }
                            {gym.members_count > 0 &&
                      <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{gym.members_count}</span>
                              </div>
                      }
                          </div>

                          {/* Gym Type at Bottom Center */}
                          {gym.type &&
                    <div className="flex justify-center pt-1">
                              <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search gyms or add new from Google Places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-10 pr-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-500" />

                {searchingPlaces &&
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />
                }
              </div>

              {/* Google Places Skeleton */}
              {searchingPlaces && searchQuery.length >= 2 &&
              <div className="rounded-xl p-3 space-y-2 bg-slate-800/90 border border-slate-700/50 animate-pulse">
                  <div className="h-4 w-40 bg-slate-700/60 rounded-lg" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) =>
                  <div key={i} className="rounded-xl bg-slate-700/50 border border-slate-600/40 overflow-hidden flex items-stretch gap-0">
                        <div className="w-20 h-20 flex-shrink-0 bg-slate-600/60" />
                        <div className="flex-1 p-3 flex flex-col justify-center gap-2">
                          <div className="h-4 bg-slate-600/60 rounded w-3/4" />
                          <div className="h-3 bg-slate-600/40 rounded w-1/2" />
                          <div className="h-3 bg-slate-600/30 rounded w-16" />
                        </div>
                      </div>
                  )}
                  </div>
                </div>
              }

              {/* Google Places Results */}
              {!searchingPlaces && searchQuery.length >= 2 && placesResults.length > 0 &&
              <div className="rounded-xl p-3 space-y-2 bg-slate-800/90 border border-green-500/50">
                  {
                <>
                      <p className="text-xs font-semibold flex items-center gap-2">
                        <Plus className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Found {placesResults.length} gyms on Google Places</span>
                      </p>
                      <div className="space-y-2">
                        {placesResults.slice(0, 5).map((place) =>
                    <button
                      key={place.place_id}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left rounded-xl bg-slate-700/50 border border-slate-600/40 hover:border-green-500/50 hover:bg-slate-700/80 transition-all overflow-hidden">

                            <div className="flex items-stretch gap-0">
                              {/* Gym photo */}
                              <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-slate-600 to-slate-700 overflow-hidden">
                                {place.photo_url ?
                          <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" /> :

                          <div className="w-full h-full flex items-center justify-center">
                                    <Dumbbell className="w-6 h-6 text-slate-500" />
                                  </div>
                          }
                              </div>
                              <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                                <h4 className="font-semibold text-white text-sm mb-0.5 truncate">{place.name}</h4>
                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{place.address}</span>
                                </div>
                                {place.rating &&
                          <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-slate-300 text-xs">{place.rating}</span>
                                  </div>
                          }
                              </div>
                              <div className="flex items-center pr-3">
                                <Badge className="bg-green-600/30 text-green-200 border border-green-500/40 text-xs">
                                  Add
                                </Badge>
                              </div>
                            </div>
                          </button>
                    )}
                      </div>
                    </>
                }
                </div>
              }

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-auto h-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                    <SelectItem value="crossfit">CrossFit</SelectItem>
                    <SelectItem value="boxing">Boxing</SelectItem>
                    <SelectItem value="mma">MMA</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={maxDistance} onValueChange={setMaxDistance}>
                  <SelectTrigger className="w-auto h-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 text-sm">
                    <SelectValue placeholder="Distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Distance</SelectItem>
                    <SelectItem value="5">Within 5 km</SelectItem>
                    <SelectItem value="10">Within 10 km</SelectItem>
                    <SelectItem value="20">Within 20 km</SelectItem>
                    <SelectItem value="50">Within 50 km</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger className="w-auto h-10 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 text-sm">
                    <SelectValue placeholder="Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    <SelectItem value="Power Racks">Power Racks</SelectItem>
                    <SelectItem value="Barbells">Barbells</SelectItem>
                    <SelectItem value="Dumbbells">Dumbbells</SelectItem>
                    <SelectItem value="Cable Machines">Cable Machines</SelectItem>
                    <SelectItem value="Cardio Equipment">Cardio Equipment</SelectItem>
                    <SelectItem value="Olympic Platforms">Olympic Platforms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gyms Grid */}
            {filteredGyms.length === 0 ?
            <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No gyms found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
              </div> :

            <div className="grid md:grid-cols-2 gap-4">
                {filteredGyms.map((gym) =>
              <div key={gym.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 shadow-2xl shadow-black/20">
                      {/* Image Section with Overlay */}
                      <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                        {gym.image_url &&
                    <img
                      src={gym.image_url}
                      alt={gym.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="eager"
                      fetchpriority="high" />

                    }

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Quick Action Button */}
                        <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-transform text-xs h-8 px-3">
                            <Dumbbell className="w-3 h-3 mr-1.5" />
                            Enter Gym
                          </Button>
                        </Link>

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                          {(gym.claim_status === 'claimed' || gym.admin_id || gym.owner_email) &&
                      <Badge className="bg-green-500 text-white text-xs shadow-lg font-semibold">
                              <BadgeCheck className="w-3 h-3 mr-1" />
                              Official
                            </Badge>
                      }
                        </div>

                        {/* Icons: Gallery, Info & Edit */}
                        <div className="absolute top-3 right-3 flex gap-3">
                          <button
                        onClick={(e) => {
                          e.preventDefault();
                          setGalleryGym(gym);
                        }}
                        className="flex items-center justify-center hover:scale-110 transition-all">

                            <Images className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                          </button>
                          <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEquipmentGym(gym);
                        }}
                        className="flex items-center justify-center hover:scale-110 transition-all">

                            <Dumbbell className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                          </button>
                          {currentUser && currentUser.email === gym.owner_email &&
                      <button
                        onClick={() => setEditingGym(gym)}
                        className="flex items-center justify-center hover:scale-110 transition-all">

                              <Edit className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                            </button>
                      }
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 space-y-2">
                        {/* Header */}
                        <div>
                          <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{gym.address || gym.city}</span>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
                          {gym.rating > 0 &&
                      <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-white text-sm">{gym.rating}/5</span>
                            </div>
                      }
                          {gym.members_count > 0 &&
                      <div className="flex items-center gap-1.5 text-sm text-slate-400">
                              <Users className="w-4 h-4" />
                              <span className="font-semibold">{gym.members_count}</span>
                            </div>
                      }
                        </div>

                        {/* Gym Type at Bottom Center */}
                        {gym.type &&
                    <div className="flex justify-center pt-1">
                            <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">
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
      </Tabs>

      <EditHeroImageModal
        open={!!editingGym}
        onClose={() => setEditingGym(null)}
        currentImageUrl={editingGym?.image_url}
        onSave={(image_url) => updateGymImageMutation.mutate({ gymId: editingGym.id, image_url })}
        isLoading={updateGymImageMutation.isPending} />


      <JoinWithCodeModal
        open={showJoinWithCode}
        onClose={() => setShowJoinWithCode(false)}
        currentUser={currentUser} />


      <Dialog open={!!equipmentGym} onOpenChange={() => setEquipmentGym(null)}>
        <DialogContent className="bg-slate-800/60 backdrop-blur-md border-slate-700/50 text-white max-w-2xl max-h-[110vh] overflow-y-auto [&>button]:hidden">
          <div className="space-y-3">
            {(() => {
              // Check if this is a bodystreak gym (mock equipment)
              const isBodystreakGym = equipmentGym?.name?.toLowerCase().includes('bodystreak');
              const mockEquipment = [
              'Nautilus Rows',
              'Hammer Strength Chest Press',
              'Leg Press',
              'Smith Machine',
              'Cable Crossover',
              'Hack Squat',
              'Preacher Curl Bench',
              'Seated Calf Raise',
              'Lat Pulldown',
              'Pec Deck',
              'Leg Extension',
              'Leg Curl',
              'Shoulder Press Machine',
              'Cable Fly',
              'T-Bar Row'];


              const equipmentList = isBodystreakGym ? mockEquipment : equipmentGym?.equipment;

              return equipmentList && equipmentList.length > 0 ?
              <div className="grid grid-cols-2 gap-2">
                  {equipmentList.map((item, idx) =>
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-600/50">

                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-slate-200 text-sm">{item}</span>
                    </div>
                )}
                </div> :

              <div className="text-center py-8 text-slate-400">
                  <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No equipment information available</p>
                </div>;

            })()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!galleryGym} onOpenChange={() => setGalleryGym(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[110vh] overflow-y-auto [&>button]:hidden">
          <div>
            {galleryGym?.gallery && galleryGym.gallery.length > 0 ?
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {galleryGym.gallery.map((imageUrl, idx) =>
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden bg-slate-700/50 border border-slate-600/50">

                    <img
                  src={imageUrl}
                  alt={`${galleryGym.name} photo ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />

                  </div>
              )}
              </div> :

            <div className="text-center py-12 text-slate-400">
                <Images className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No photos available</p>
              </div>
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Primary Gym Selection Modal */}
      <Dialog open={showPrimaryGymModal} onOpenChange={setShowPrimaryGymModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              Set Primary Gym
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-3">
              <p className="text-purple-200 text-sm">
                Your primary gym is the default community shown on the Home page and accessed via the Community navigation button.
              </p>
            </div>

            <div className="space-y-2">
              {userGyms.map((gym) => {
                const isPrimary = selectedPrimaryGym === gym.id || !selectedPrimaryGym && currentUser?.primary_gym_id === gym.id;
                return (
                  <button
                    key={gym.id}
                    onClick={() => setSelectedPrimaryGym(gym.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isPrimary ?
                    'bg-purple-500/20 border-purple-400/50' :
                    'bg-slate-800/50 border-slate-700/50 hover:border-purple-400/30'}`
                    }>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isPrimary ? 'bg-purple-500' : 'bg-slate-700'}`
                        }>
                          <Dumbbell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{gym.name}</h4>
                          <p className="text-xs text-slate-400">{gym.city}</p>
                        </div>
                      </div>
                      {isPrimary &&
                      <Badge className="bg-purple-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Primary
                        </Badge>
                      }
                    </div>
                  </button>);

              })}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowPrimaryGymModal(false);
                  setSelectedPrimaryGym(null);
                }}
                variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 bg-black backdrop-blur-md text-white border border-slate-700 h-9 px-4 flex-1 shadow-[0_3px_0_0_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu\n">


                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedPrimaryGym) {
                    updatePrimaryGymMutation.mutate(selectedPrimaryGym);
                  } else {
                    setShowPrimaryGymModal(false);
                    setSelectedPrimaryGym(null);
                  }
                }}
                disabled={updatePrimaryGymMutation.isPending} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 backdrop-blur-md text-white border border-transparent h-9 px-4 flex-1 shadow-[0_3px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu\n">


                {updatePrimaryGymMutation.isPending ?
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </> :

                'Save'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Join Modal */}
      <Dialog open={showConfirmJoin} onOpenChange={() => {
        setShowConfirmJoin(false);
        setPendingGymData(null);
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {gymMemberships.length > 0 ? 'Replace Primary Gym?' : 'Join This Community?'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {gymMemberships.length > 0 ?
            <p className="text-slate-300 text-sm">
                You're currently a member of <span className="font-semibold text-white">{gymMemberships[0]?.gym_name}</span>. 
                Joining <span className="font-semibold text-white">{selectedPlaceGym?.name}</span> will replace your primary gym.
              </p> :

            <p className="text-slate-300 text-sm">
                Are you sure you want to join <span className="font-semibold text-white">{selectedPlaceGym?.name}</span>? 
                This is an unclaimed community gym.
              </p>
            }
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowConfirmJoin(false);
                  setPendingGymData(null);
                }}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">

                Cancel
              </Button>
              <Button
                onClick={handleConfirmJoin}
                disabled={createGymMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">

                {createGymMutation.isPending ?
                <Loader2 className="w-4 h-4 animate-spin" /> :

                'Confirm'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Leave Gym Modal */}
      <Dialog open={!!confirmLeaveGym} onOpenChange={() => setConfirmLeaveGym(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Leave {confirmLeaveGym?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300 text-sm">Are you sure you want to leave this gym? You'll lose access to its community.</p>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setConfirmLeaveGym(null)}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">

              Cancel
            </Button>
            <Button
              onClick={() => {
                leaveGymMutation.mutate(confirmLeaveGym.id);
                setConfirmLeaveGym(null);
              }}
              disabled={leaveGymMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white">

              {leaveGymMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Leave Gym'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Gym Modal */}
      <Dialog open={showAddGymModal} onOpenChange={() => {
        setShowAddGymModal(false);
        setSelectedPlaceGym(null);
        setIsOwner(false);
        setGymType('general');
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Gym to CoStride</DialogTitle>
          </DialogHeader>
          {selectedPlaceGym &&
          <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">{selectedPlaceGym.name}</h3>
                    <div className="flex items-start gap-2 text-slate-300 text-sm mb-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{selectedPlaceGym.address}</span>
                    </div>
                    {selectedPlaceGym.rating &&
                  <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-slate-300 text-sm">{selectedPlaceGym.rating} rating</span>
                      </div>
                  }
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Gym Type</label>
                <Select value={gymType} onValueChange={setGymType}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Fitness</SelectItem>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                    <SelectItem value="crossfit">CrossFit</SelectItem>
                    <SelectItem value="boxing">Boxing</SelectItem>
                    <SelectItem value="mma">MMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentUser?.account_type === 'gym_owner' &&
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-xl p-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                  type="checkbox"
                  checked={isOwner}
                  onChange={(e) => setIsOwner(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-purple-400 text-purple-600 focus:ring-purple-500" />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">I am the owner/manager of this gym</span>
                        <Crown className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-slate-300 text-xs">
                        Check this if you own or manage this gym. You'll have full control over the gym's profile.
                      </p>
                    </div>
                  </label>
                </div>
            }

              <Button
              onClick={handleCreateGym}
              disabled={createGymMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold py-6 text-base shadow-lg">

                {createGymMutation.isPending ?
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> :

              <CheckCircle className="w-5 h-5 mr-2" />
              }
                {isOwner ? 'Claim & Add Gym' : 'Add Gym'}
              </Button>

              {isOwner &&
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
                  <p className="text-blue-300 text-xs text-center">
                    ✓ Your gym will be marked as verified and you'll become the admin
                  </p>
                </div>
            }
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>);

}