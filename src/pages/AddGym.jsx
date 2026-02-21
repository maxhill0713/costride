import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MobileSelect } from '@/components/ui/mobile-select';
import { Search, MapPin, Building2, CheckCircle, Loader2, AlertCircle, Crown, X } from 'lucide-react';

export default function AddGym() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGym, setSelectedGym] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [gymType, setGymType] = useState('general');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createGymMutation = useMutation({
    mutationFn: async (gymData) => {
      const res = await base44.functions.invoke('addGym', { gymData });
      return res.data;
    },
    onSuccess: (result) => {
      navigate(createPageUrl('GymCommunity') + `?id=${result.gym.id}`);
    }
  });

  const searchPlaces = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await base44.functions.invoke('searchGymsPlaces', { input: query });
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSelectGym = (gym) => {
    setSelectedGym(gym);
  };

  const handleCreateGym = () => {
    if (!selectedGym) return;

    const addressParts = selectedGym.address.split(',');
    const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : selectedGym.address;

    const gymData = {
      name: selectedGym.name,
      address: selectedGym.address,
      city: city,
      google_place_id: selectedGym.place_id,
      latitude: selectedGym.latitude,
      longitude: selectedGym.longitude,
      type: gymType,
      claim_status: isOwner ? 'claimed' : 'unclaimed',
      admin_id: isOwner ? currentUser?.id : null,
      owner_email: isOwner ? currentUser?.email : null,
      verified: isOwner,
      members_count: 0
    };

    createGymMutation.mutate(gymData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white mb-2">Add a Gym</h1>
          <p className="text-slate-300 text-sm">Search for your gym and add it to CoStride</p>
        </div>

        {/* Search Section */}
         {!selectedGym && (
           <Card className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 p-6 mb-6">
             <div className="space-y-4">
               <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                 <Input
                   value={searchInput}
                   onChange={handleInputChange}
                   onFocus={() => searchInput && setShowDropdown(true)}
                   placeholder="Search for a gym..."
                   className="pl-10 pr-10 bg-slate-800/60 border-slate-600/40 text-white placeholder:text-slate-500 rounded-xl"
                 />
                 {searchInput && (
                   <button
                     onClick={() => {
                       setSearchInput('');
                       setSearchResults([]);
                       setShowDropdown(false);
                     }}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                   >
                     <X className="w-4 h-4" />
                   </button>
                 )}

                 {/* Dropdown Results */}
                 {showDropdown && searchResults.length > 0 && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                     <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                       <div className="p-2 space-y-1">
                         {searchResults.map((gym) => (
                           <button
                             key={gym.place_id}
                             onClick={() => {
                               handleSelectGym(gym);
                               setShowDropdown(false);
                             }}
                             className="w-full text-left p-3 rounded-lg hover:bg-slate-800/60 transition-all hover:border-blue-500/30 border border-transparent"
                           >
                             <div className="flex items-start gap-2">
                               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                 <Building2 className="w-4 h-4 text-white" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <h3 className="font-semibold text-white text-sm">{gym.name}</h3>
                                 <div className="flex items-center gap-1 text-slate-400 text-xs">
                                   <MapPin className="w-3 h-3 flex-shrink-0" />
                                   <span className="truncate">{gym.address}</span>
                                 </div>
                                 {gym.rating && (
                                   <div className="flex items-center gap-1 mt-0.5">
                                     <span className="text-yellow-400 text-xs">★</span>
                                     <span className="text-slate-400 text-xs">{gym.rating}</span>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </button>
                         ))}
                       </div>
                     </div>
                   </>
                 )}

                 {showDropdown && searchResults.length === 0 && searchInput && !searching && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                     <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-lg z-50 p-6 text-center">
                       <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                       <p className="text-slate-400 text-sm">No gyms found. Try a different search.</p>
                     </div>
                   </>
                 )}

                 {showDropdown && searching && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                     <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-lg z-50 p-6 text-center">
                       <Loader2 className="w-6 h-6 text-blue-500 mx-auto animate-spin" />
                     </div>
                   </>
                 )}
               </div>
             </div>
           </Card>
         )}

        {/* Confirmation Section */}
        {selectedGym && (
          <Card className="bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 p-6">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Confirm Gym Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGym(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Back to Search
                  </Button>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-2">{selectedGym.name}</h3>
                      <div className="flex items-start gap-2 text-slate-300 text-sm mb-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{selectedGym.address}</span>
                      </div>
                      {selectedGym.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-slate-300 text-sm">{selectedGym.rating} rating</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gym Type Selection */}
              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Gym Type</label>
                <MobileSelect
                  value={gymType}
                  onValueChange={setGymType}
                  placeholder="Select gym type"
                  options={[
                    { value: 'general', label: 'General Fitness' },
                    { value: 'powerlifting', label: 'Powerlifting' },
                    { value: 'bodybuilding', label: 'Bodybuilding' },
                    { value: 'crossfit', label: 'CrossFit' },
                    { value: 'boxing', label: 'Boxing' },
                    { value: 'mma', label: 'MMA' }
                  ]}
                  triggerClassName="bg-slate-800/60 border-slate-600/40 text-white"
                />
              </div>

              {/* Ownership Checkbox */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOwner}
                    onChange={(e) => setIsOwner(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-purple-400 text-purple-600 focus:ring-purple-500"
                  />
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

              {/* Create Button */}
              <Button
                onClick={handleCreateGym}
                disabled={createGymMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold py-6 text-lg shadow-lg min-h-[56px]"
              >
                {createGymMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {isOwner ? 'Claim & Add Gym' : 'Add Gym'}
              </Button>

              {isOwner && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
                  <p className="text-blue-300 text-xs text-center">
                    ✓ Your gym will be marked as verified and you'll become the admin
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}