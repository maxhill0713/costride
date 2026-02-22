import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dumbbell, Loader2, CheckCircle2, Search, MapPin, AlertCircle, ArrowRight, Building2, Star, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function GymSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    google_place_id: '',
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    postcode: '',
    type: 'general',
    language: 'en',
    amenities: [],
    equipment: [],
    specializes_in: []
  });

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [ghostGym, setGhostGym] = useState(null);
  const [showGhostGymModal, setShowGhostGymModal] = useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState(null);
  const [submittedGym, setSubmittedGym] = useState(null);

  const queryClient = useQueryClient();

  const amenitiesOptions = ['WiFi', 'Parking', '24/7', 'Personal Training', 'Showers', 'Lockers', 'Sauna', 'Smoothie Bar'];
  const specializationOptions = ['Weight Loss', 'Muscle Gain', 'Bulking Programs', 'Strength Training', 'Powerlifting', 'Bodybuilding', 'CrossFit', 'HIIT', 'Cardio', 'Rehabilitation'];
  const gymTypes = [
    { value: 'general', label: 'General Fitness' },
    { value: 'powerlifting', label: 'Powerlifting' },
    { value: 'bodybuilding', label: 'Bodybuilding' },
    { value: 'crossfit', label: 'CrossFit' },
    { value: 'boxing', label: 'Boxing' },
    { value: 'mma', label: 'MMA' }
  ];

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const verifyEmailDomain = (email, website) => {
    if (!email || !website) return null;
    const emailDomain = email.split('@')[1]?.toLowerCase();
    const genericProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    
    if (genericProviders.includes(emailDomain)) return 'manual_review';
    
    let websiteDomain = website.toLowerCase()
      .replace('http://', '')
      .replace('https://', '')
      .replace('www.', '')
      .split('/')[0];
    
    return (emailDomain === websiteDomain || websiteDomain.includes(emailDomain)) ? 'verified' : 'manual_review';
  };

  const detectLanguageFromCity = (city) => {
    const spanishCities = ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'];
    return spanishCities.some(sc => city?.includes(sc)) ? 'es' : 'en';
  };

  const searchGooglePlaces = async (query) => {
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

  const handleSelectPlace = async (place) => {
    setSelectedPlace(place);
    setSearchInput(place.name);
    setSearchResults([]);

    try {
      const existingGyms = await base44.entities.Gym.filter({ 
        google_place_id: place.place_id 
      });

      const ghostGymMatch = existingGyms.find(gym => gym.claim_status === 'unclaimed');

      if (ghostGymMatch) {
        setGhostGym(ghostGymMatch);
        setShowGhostGymModal(true);
      } else {
        setFormData(prev => ({
          ...prev,
          name: place.name,
          google_place_id: place.place_id,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address || '',
          city: place.city || '',
          postcode: place.postcode || ''
        }));
      }

      if (currentUser?.email && place.website) {
        setEmailVerificationStatus(verifyEmailDomain(currentUser.email, place.website));
      }
    } catch (error) {
      console.error('Error checking gym:', error);
      setFormData(prev => ({
        ...prev,
        name: place.name,
        google_place_id: place.place_id,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address || '',
        city: place.city || '',
        postcode: place.postcode || ''
      }));
    }
  };

  const handleClaimGhostGym = () => {
    if (ghostGym) {
      setFormData(prev => ({
        ...prev,
        name: ghostGym.name,
        google_place_id: ghostGym.google_place_id,
        latitude: ghostGym.latitude,
        longitude: ghostGym.longitude,
        address: ghostGym.address || '',
        city: ghostGym.city || '',
        postcode: ghostGym.postcode || '',
        type: ghostGym.type || 'general',
        amenities: ghostGym.amenities || [],
        equipment: ghostGym.equipment || [],
        specializes_in: ghostGym.specializes_in || [],
        claimingGymId: ghostGym.id
      }));
      setShowGhostGymModal(false);
      toast.success('Gym claimed! Complete the signup.');
    }
  };

  const createGymMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      await base44.auth.updateMe({ 
        account_type: 'gym_owner',
        onboarding_completed: true 
      });

      const gymLanguage = data.language || detectLanguageFromCity(data.city);
      const isVerified = emailVerificationStatus === 'verified';

      let gym;
      if (data.claimingGymId) {
        gym = await base44.asServiceRole.entities.Gym.update(data.claimingGymId, {
          name: data.name,
          type: data.type,
          language: gymLanguage,
          owner_email: user.email,
          admin_id: user.id,
          amenities: data.amenities,
          equipment: data.equipment,
          specializes_in: data.specializes_in,
          claim_status: 'claimed',
          status: isVerified ? 'approved' : 'pending',
          verified: isVerified
        });
      } else {
        const generateCode = async () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code;
          let isUnique = false;
          let attempts = 0;

          while (!isUnique && attempts < 10) {
            code = '';
            for (let i = 0; i < 6; i++) {
              code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const existing = await base44.asServiceRole.entities.Gym.filter({ join_code: code });
            isUnique = existing.length === 0;
            attempts++;
          }
          return code;
        };

        const joinCode = await generateCode();

        gym = await base44.entities.Gym.create({
          ...data,
          language: gymLanguage,
          owner_email: user.email,
          join_code: joinCode,
          verified: isVerified,
          admin_id: user.id,
          claim_status: 'claimed',
          status: isVerified ? 'approved' : 'pending'
        });
      }

      await base44.entities.GymMembership.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'lifetime'
      });

      return gym;
    },
    onSuccess: (gym) => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      toast.success('Your gym has been registered!');
      
      // Navigate based on verification status
      if (gym?.status === 'approved') {
        navigate(createPageUrl('GymOwnerDashboard'));
      } else if (gym?.status === 'pending') {
        navigate(createPageUrl('GymUnderReview'));
      } else {
        // Fallback to dashboard if status is unclear
        navigate(createPageUrl('GymOwnerDashboard'));
      }
    },
    onError: (error) => {
      console.error('Gym registration error:', error);
      toast.error(error?.message || 'Failed to register gym.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createGymMutation.mutate(formData);
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 py-8 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-800/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
            alt="CoStride Logo"
            className="w-16 h-16 rounded-3xl mx-auto mb-4 object-cover shadow-2xl shadow-blue-500/30"
          />
          <h1 className="text-3xl font-black text-white mb-2">Register Your Gym</h1>
          <p className="text-slate-400">Grow your gym community with our platform</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
            1
          </div>
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
            2
          </div>
        </div>

        <Card className="p-8 bg-slate-900/80 backdrop-blur-2xl border border-white/8 shadow-2xl shadow-black/60">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Account Setup</h2>
                  <p className="text-slate-400 text-sm">Create your gym owner account</p>
                </div>

                {/* Gym Search */}
                <div>
                  <Label className="text-white font-semibold">Find Your Gym</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        searchGooglePlaces(e.target.value);
                      }}
                      placeholder="Search gym name or location..."
                      className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 pl-9 h-11"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                      {searchResults.slice(0, 8).map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3"
                        >
                          <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                          <div className="min-w-0">
                            <div className="font-medium text-white">{place.name}</div>
                            <div className="text-xs text-slate-400">{place.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedPlace && (
                    <div className="mt-2 p-3 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-300">{selectedPlace.name} selected</span>
                    </div>
                  )}
                </div>

                {/* Gym Type */}
                <div>
                  <Label className="text-white font-semibold">Gym Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {gymTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                          formData.type === type.value
                            ? 'bg-blue-500/30 border-blue-400/60 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Verification Status */}
                {emailVerificationStatus === 'verified' && (
                  <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-green-300">✓ Email verified! Domain matches.</p>
                  </div>
                )}

                {emailVerificationStatus === 'manual_review' && (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300">Manual Review Required</p>
                      <p className="text-xs text-amber-200 mt-0.5">We'll verify your ownership within 24 hours.</p>
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedPlace}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl h-11 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* STEP 2: Details */}
            {step === 2 && (
              <div className="space-y-8">
                {/* Header */}
                <div className="pb-4 border-b border-white/10">
                  <h2 className="text-3xl font-black text-white mb-1">{formData.name}</h2>
                  <p className="text-slate-400 text-sm">Complete your gym profile</p>
                </div>

                {/* Gym Overview Card */}
                <div className="grid grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-blue-400 mb-1">
                      {gymTypes.find(t => t.value === formData.type)?.label.split(' ')[0]}
                    </div>
                    <p className="text-xs text-slate-400">Type</p>
                  </div>
                  <div className="text-center border-l border-r border-white/10">
                    <div className="text-2xl font-black text-purple-400 mb-1">{formData.specializes_in.length}</div>
                    <p className="text-xs text-slate-400">Specialties</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-green-400 mb-1">{formData.amenities.length}</div>
                    <p className="text-xs text-slate-400">Amenities</p>
                  </div>
                </div>

                {/* Specializations Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-400" />
                      Specializations
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">What does your gym specialize in? (Choose at least 1)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {specializationOptions.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleArrayItem('specializes_in', spec)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                          formData.specializes_in.includes(spec)
                            ? 'bg-purple-500/30 border-purple-400/60 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-purple-400/30'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-400" />
                      Amenities & Features
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">What amenities does your gym offer?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {amenitiesOptions.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleArrayItem('amenities', amenity)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                          formData.amenities.includes(amenity)
                            ? 'bg-green-500/30 border-green-400/60 text-white shadow-lg shadow-green-500/20'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-green-400/30'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-white text-lg">Registration Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <span className="text-slate-400">Gym Name</span>
                      <span className="text-white font-semibold">{formData.name}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <span className="text-slate-400">Location</span>
                      <span className="text-white font-semibold text-right text-sm">{formData.city}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/10">
                      <span className="text-slate-400">Type</span>
                      <span className="text-white font-semibold">{gymTypes.find(t => t.value === formData.type)?.label}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-slate-400">Total Selections</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {formData.specializes_in.length + formData.amenities.length} items
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-xl h-12 font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createGymMutation.isPending || formData.specializes_in.length === 0}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                  >
                    {createGymMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Gym...
                      </>
                    ) : (
                      <>
                        Complete Registration
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Ghost Gym Modal */}
        {showGhostGymModal && ghostGym && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 bg-white/10 backdrop-blur-2xl border border-amber-400/40 shadow-2xl">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Community Found!</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Members have already created a community for {ghostGym.name} with <span className="font-semibold text-white">{ghostGym.members_count || 0} members</span>. Claim it to take control.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-white mb-2">{ghostGym.name}</h4>
                <div className="space-y-1 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>{ghostGym.members_count || 0} members</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowGhostGymModal(false)}
                  variant="outline"
                  className="flex-1 rounded-lg border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleClaimGhostGym}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg"
                >
                  Claim
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}