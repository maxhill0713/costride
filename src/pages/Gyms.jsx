import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Wifi, Clock, ParkingCircle, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Gyms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedGyms, setSavedGyms] = useState([]);

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const filteredGyms = gyms.filter(gym =>
    gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gym.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-black text-white mb-6 flex items-center gap-2">
            <MapPin className="w-8 h-8" />
            Find Gyms Near You
          </h1>
          <Input
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 bg-white rounded-2xl border-0"
          />
        </div>
      </div>

      {/* Gyms List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {filteredGyms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-gray-100">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-700">No gyms found</p>
            <p className="text-sm text-gray-500 mt-1">Try a different search</p>
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
                </div>
              )}

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-900">{gym.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {gym.address || gym.city}
                    </p>
                  </div>
                  {gym.price && (
                    <div className="text-right">
                      <div className="text-2xl font-black text-blue-600">${gym.price}</div>
                      <div className="text-xs text-gray-500">/month</div>
                    </div>
                  )}
                </div>

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
                  <Button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl">
                    View Details
                  </Button>
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