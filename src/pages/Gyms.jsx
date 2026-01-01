import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Wifi, Clock, ParkingCircle, Heart, Filter, Gift, BadgeCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Gyms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedGyms, setSavedGyms] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <MapPin className="w-8 h-8" />
              Gym Community
            </h1>
            <Link to={createPageUrl('GymSignup')}>
              <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-2xl">
                Register Your Gym
              </Button>
            </Link>
          </div>
          <Input
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 bg-white rounded-2xl border-0"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-bold text-gray-900">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="rounded-2xl border-2 border-gray-200">
                <SelectValue placeholder="Gym Type" />
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
              <SelectTrigger className="rounded-2xl border-2 border-gray-200">
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
              <SelectTrigger className="rounded-2xl border-2 border-gray-200">
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
      </div>

      {/* Gyms List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {filteredGyms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-gray-100">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-700">No gyms found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredGyms.map((gym) => (
            <Card key={gym.id} className="bg-white border-2 border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-lg transition-all">
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
          ))
        )}
      </div>
    </div>
  );
}