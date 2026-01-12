import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Wifi, Clock, ParkingCircle, Heart, Filter, Gift, BadgeCheck, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';

export default function Gyms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedGyms, setSavedGyms] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [editingGym, setEditingGym] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: gyms = [] } = useQuery({
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

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || gym.type === selectedType;
    const matchesDistance = maxDistance === 'all' || (gym.distance_km && gym.distance_km <= parseFloat(maxDistance));
    const matchesEquipment = selectedEquipment === 'all' || 
                            (gym.equipment && gym.equipment.includes(selectedEquipment));
    
    return matchesSearch && matchesType && matchesDistance && matchesEquipment;
  });

  const amenityIcons = {
    'WiFi': Wifi,
    'Parking': ParkingCircle,
    '24/7': Clock,
    'Personal Training': Users
  };

  const toggleSave = (gymId) => {
    setSavedGyms(prev =>
      prev.includes(gymId)
        ? prev.filter(id => id !== gymId)
        : [...prev, gymId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 px-4 py-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMCAxMGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bS0xMCAwYzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMTAgMTBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyek0yNiAzNGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTEwIDBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white">
                Gym Community
              </h1>
            </div>
          </div>
          <Input
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 bg-white/95 backdrop-blur-sm rounded-2xl border-0 shadow-xl text-base"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xl border-b border-gray-200/50 px-4 py-2 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-9 rounded-xl border-2 border-gray-200 text-sm">
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
            <SelectTrigger className="h-9 rounded-xl border-2 border-gray-200 text-sm">
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
            <SelectTrigger className="h-9 rounded-xl border-2 border-gray-200 text-sm">
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

      {/* Gyms List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {filteredGyms.length === 0 ? (
          <div className="text-center py-16 bg-slate-100/80 rounded-3xl border-2 border-gray-100">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-700">No gyms found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredGyms.map((gym) => {
            const isOwner = currentUser && currentUser.email === gym.owner_email && currentUser.account_type === 'gym_owner';

            return (
            <Card key={gym.id} className="bg-slate-50/95 backdrop-blur-sm border border-gray-200/50 overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 rounded-3xl">
              {/* Image */}
              {gym.image_url && (
                <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-cyan-500 relative">
                  <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => toggleSave(gym.id)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <Heart className={`w-5 h-5 ${savedGyms.includes(gym.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                  </button>
                  {gym.verified && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-500 text-white flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    </div>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setEditingGym(gym)}
                      className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              )}

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900">{gym.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {gym.address || gym.city}
                      </p>
                      {gym.distance_km && (
                        <Badge variant="outline" className="text-xs">{gym.distance_km} km</Badge>
                      )}
                    </div>
                    {gym.type && (
                      <Badge className="mt-2 capitalize">{gym.type}</Badge>
                    )}
                  </div>
                  {gym.price && (
                    <div className="text-right">
                      <div className="text-2xl font-black text-blue-600">£{gym.price}</div>
                      <div className="text-xs text-gray-500">/month</div>
                    </div>
                  )}
                </div>

                {/* Reward Offer */}
                {gym.reward_offer && (
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-2xl p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-orange-600" />
                      <span className="font-bold text-orange-900">{gym.reward_offer}</span>
                    </div>
                  </div>
                )}

                {/* Rating & Members */}
                <div className="flex items-center gap-4 mb-4">
                  {gym.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-900">{gym.rating}</span>
                      <span className="text-sm text-gray-500">/5</span>
                    </div>
                  )}
                  {gym.members_count && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{gym.members_count} members</span>
                    </div>
                  )}
                </div>

                {/* Equipment */}
                {gym.equipment && gym.equipment.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Equipment</p>
                    <div className="flex flex-wrap gap-2">
                      {gym.equipment.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {gym.amenities && gym.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {gym.amenities.map((amenity, idx) => {
                      const Icon = amenityIcons[amenity] || Dumbbell;
                      return (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          <Icon className="w-4 h-4" />
                          <span>{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* CTA */}
                <div className="flex gap-2">
                  <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id} className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl">
                      View Community
                    </Button>
                  </Link>
                  <Button variant="outline" className="px-6 border-2 border-gray-200 rounded-2xl font-semibold">
                    Check In
                  </Button>
                </div>
              </div>
              </Card>
              );
              })
              )}
              </div>

              <EditHeroImageModal
              open={!!editingGym}
              onClose={() => setEditingGym(null)}
              currentImageUrl={editingGym?.image_url}
              onSave={(image_url) => updateGymImageMutation.mutate({ gymId: editingGym.id, image_url })}
              isLoading={updateGymImageMutation.isPending}
              />
              </div>
              );
              }