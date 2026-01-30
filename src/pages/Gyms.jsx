import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Filter, Gift, BadgeCheck, Edit, Key, Heart, LogIn, Images } from 'lucide-react';
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
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
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
    enabled: !!currentUser
  });

  const { data: gyms = [], isLoading: gymsLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const updateGymImageMutation = useMutation({
    mutationFn: ({ gymId, image_url }) => base44.entities.Gym.update(gymId, { image_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setEditingGym(null);
    }
  });

  const userGyms = gymMemberships.length > 0 
    ? gyms.filter(g => gymMemberships.some(m => m.gym_id === g.id))
    : [];

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || gym.type === selectedType;
    const matchesDistance = maxDistance === 'all' || (gym.distance_km && gym.distance_km <= parseFloat(maxDistance));
    const matchesEquipment = selectedEquipment === 'all' || 
                            (gym.equipment && gym.equipment.includes(selectedEquipment));
    
    return matchesSearch && matchesType && matchesDistance && matchesEquipment;
  });

  const toggleSave = (gymId) => {
    setSavedGyms(prev =>
      prev.includes(gymId)
        ? prev.filter(id => id !== gymId)
        : [...prev, gymId]
    );
  };



  const GymCard = ({ gym }) => {
    const isOwner = currentUser && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';

    return (
      <div className="group cursor-pointer">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl">
          {/* Image Section */}
          {gym.image_url && (
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
                {gym.verified && (
                  <Badge className="bg-green-500/90 text-white text-xs">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => setEquipmentGym(gym)}
                  className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                  <Dumbbell className="w-4 h-4 text-slate-300" />
                </button>
                <button
                  onClick={() => toggleSave(gym.id)}
                  className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-800 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${savedGyms.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                </button>
                {isOwner && (
                  <button
                    onClick={() => setEditingGym(gym)}
                    className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-slate-300" />
                  </button>
                )}
              </div>
            </div>
          )}

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
              {gym.type && (
                <Badge className="bg-blue-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">
                  {gym.type}
                </Badge>
              )}
              {gym.distance_km && (
                <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600/50 text-xs">
                  {gym.distance_km} km
                </Badge>
              )}
            </div>

            {/* Rating & Members */}
            <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
              {gym.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-slate-100 text-sm">{gym.rating}/5</span>
                </div>
              )}
              {gym.members_count && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>{gym.members_count}</span>
                </div>
              )}
            </div>

            {/* Reward Offer */}
            {gym.reward_offer && (
              <div className="bg-orange-600/20 border border-orange-500/30 rounded-lg p-2.5 flex items-center gap-2">
                <Gift className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-200 line-clamp-1">{gym.reward_offer}</span>
              </div>
            )}

            {/* Price */}
            {gym.price && parseInt(gym.price) > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blue-400">£{gym.price}</span>
                <span className="text-xs text-slate-400">/month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative pt-8 pb-6 px-3 md:px-4 border-b border-blue-700/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600/30 rounded-xl flex items-center justify-center border border-blue-500/50">
                <Dumbbell className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
                {userGyms.length > 0 ? 'My Gyms' : 'Find Gyms'}
              </h1>
            </div>
            <Button 
              onClick={() => setShowJoinWithCode(true)}
              className="bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/50 gap-2 rounded-xl"
            >
              <Key className="w-4 h-4" />
              Join with Code
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={userGyms.length > 0 ? "my-gyms" : "explore"} className="w-full">
        {/* Tab List */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4">
          <div className="max-w-6xl mx-auto">
            <TabsList className="w-screen md:w-full flex justify-center bg-transparent p-0 h-14 gap-8 border-0 overflow-x-auto md:overflow-x-visible">
              {userGyms.length > 0 && (
                <TabsTrigger 
                  value="my-gyms" 
                  className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent"
                >
                  <Users className="w-4 h-4 mr-2" />
                  My Gyms
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="explore" 
                className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Explore
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* My Gyms Tab */}
        {userGyms.length > 0 && (
          <TabsContent value="my-gyms" className="mt-0 px-3 md:px-4 py-6">
            <div className="max-w-6xl mx-auto">
              {/* Gyms Grid */}
              {userGyms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">No gym memberships yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {userGyms.map((gym) => (
                    <div key={gym.id} className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md border-2 border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                        {/* Image Section with Overlay */}
                        {gym.image_url && (
                          <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                            <img 
                              src={gym.image_url} 
                              alt={gym.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Quick Action Button */}
                            <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl transform scale-95 group-hover:scale-100 transition-transform">
                                <Dumbbell className="w-4 h-4 mr-2" />
                                Enter Gym
                              </Button>
                            </Link>

                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex gap-2">
                              {gym.verified && (
                                <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                  <BadgeCheck className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              <Badge className="bg-blue-500/90 text-white text-xs shadow-lg">
                                Member
                              </Badge>
                            </div>

                            {/* Icons: Gallery, Info, Heart & Edit */}
                            <div className="absolute top-3 right-3 flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setGalleryGym(gym);
                                }}
                                className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                              >
                                <Images className="w-4 h-4 text-slate-300" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setEquipmentGym(gym);
                                }}
                                className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                              >
                                <Dumbbell className="w-4 h-4 text-slate-300" />
                              </button>
                              <button
                                onClick={() => toggleSave(gym.id)}
                                className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                              >
                                <Heart className={`w-4 h-4 ${savedGyms.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                              </button>
                              {currentUser && currentUser.email === gym.owner_email && (
                                <button
                                  onClick={() => setEditingGym(gym)}
                                  className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                                >
                                  <Edit className="w-4 h-4 text-slate-300" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="p-5 space-y-4">
                          {/* Header */}
                          <div>
                            <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="line-clamp-1">{gym.address || gym.city}</span>
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                            <div className="flex items-center gap-4">
                              {gym.rating && (
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-bold text-white text-sm">{gym.rating}/5</span>
                                </div>
                              )}
                              {gym.members_count && (
                                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                  <Users className="w-4 h-4" />
                                  <span className="font-semibold">{gym.members_count}</span>
                                </div>
                              )}
                            </div>
                            
                            {gym.type && (
                              <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">
                                {gym.type}
                              </Badge>
                            )}
                          </div>

                          {/* Reward Offer */}
                          {gym.reward_offer && (
                            <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/40 rounded-xl p-3 flex items-center gap-2">
                              <Gift className="w-5 h-5 text-orange-400 flex-shrink-0" />
                              <span className="text-sm font-bold text-orange-200 line-clamp-1">{gym.reward_offer}</span>
                            </div>
                          )}

                          {/* Price */}
                          {gym.price && parseInt(gym.price) > 0 && (
                            <div className="flex items-baseline gap-1 pt-2">
                              <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">£{gym.price}</span>
                              <span className="text-sm text-slate-400">/month</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Explore Tab */}
         <TabsContent value="explore" className="mt-0 px-3 md:px-4 py-6">
          <div className="max-w-6xl mx-auto">
            {/* Search & Filters */}
            <div className="space-y-3 mb-6">
              <Input
                placeholder="Search by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-500"
              />

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
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
            {gymsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-slate-400">Loading gyms...</p>
              </div>
            ) : filteredGyms.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No gyms found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredGyms.map((gym) => (
                  <div key={gym.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md border-2 border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                      {/* Image Section with Overlay */}
                      {gym.image_url && (
                        <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                          <img 
                            src={gym.image_url} 
                            alt={gym.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          {/* Quick Action Button */}
                          <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl transform scale-95 group-hover:scale-100 transition-transform">
                              <Dumbbell className="w-4 h-4 mr-2" />
                              Enter Gym
                            </Button>
                          </Link>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            {gym.verified && (
                              <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                <BadgeCheck className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>

                          {/* Icons: Gallery, Info, Heart & Edit */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setGalleryGym(gym);
                              }}
                              className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                            >
                              <Images className="w-4 h-4 text-slate-300" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setEquipmentGym(gym);
                              }}
                              className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                            >
                              <Info className="w-4 h-4 text-slate-300" />
                            </button>
                            <button
                              onClick={() => toggleSave(gym.id)}
                              className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                            >
                              <Heart className={`w-4 h-4 ${savedGyms.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                            </button>
                            {currentUser && currentUser.email === gym.owner_email && (
                              <button
                                onClick={() => setEditingGym(gym)}
                                className="w-9 h-9 rounded-xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center hover:bg-slate-800 transition-all hover:scale-110"
                              >
                                <Edit className="w-4 h-4 text-slate-300" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Content Section */}
                      <div className="p-5 space-y-4">
                        {/* Header */}
                        <div>
                          <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{gym.address || gym.city}</span>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                          <div className="flex items-center gap-4">
                            {gym.rating && (
                              <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-white text-sm">{gym.rating}/5</span>
                              </div>
                            )}
                            {gym.members_count && (
                              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{gym.members_count}</span>
                              </div>
                            )}
                          </div>

                          {gym.type && (
                            <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">
                              {gym.type}
                            </Badge>
                          )}
                        </div>

                        {/* Reward Offer */}
                        {gym.reward_offer && (
                          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/40 rounded-xl p-3 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-orange-400 flex-shrink-0" />
                            <span className="text-sm font-bold text-orange-200 line-clamp-1">{gym.reward_offer}</span>
                          </div>
                        )}

                        {/* Price */}
                        {gym.price && parseInt(gym.price) > 0 && (
                          <div className="flex items-baseline gap-1 pt-2">
                            <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">£{gym.price}</span>
                            <span className="text-sm text-slate-400">/month</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
         </TabsContent>
      </Tabs>

      <EditHeroImageModal
        open={!!editingGym}
        onClose={() => setEditingGym(null)}
        currentImageUrl={editingGym?.image_url}
        onSave={(image_url) => updateGymImageMutation.mutate({ gymId: editingGym.id, image_url })}
        isLoading={updateGymImageMutation.isPending}
      />

      <JoinWithCodeModal
        open={showJoinWithCode}
        onClose={() => setShowJoinWithCode(false)}
        currentUser={currentUser}
      />

      <Dialog open={!!equipmentGym} onOpenChange={() => setEquipmentGym(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-blue-400" />
              {equipmentGym?.name} - Equipment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {equipmentGym?.equipment && equipmentGym.equipment.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {equipmentGym.equipment.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-600/50"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-slate-200 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No equipment information available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!galleryGym} onOpenChange={() => setGalleryGym(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Images className="w-5 h-5 text-blue-400" />
              {galleryGym?.name} - Gallery
            </DialogTitle>
          </DialogHeader>
          <div>
            {galleryGym?.gallery && galleryGym.gallery.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {galleryGym.gallery.map((imageUrl, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden bg-slate-700/50 border border-slate-600/50"
                  >
                    <img
                      src={imageUrl}
                      alt={`${galleryGym.name} photo ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Images className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No photos available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}