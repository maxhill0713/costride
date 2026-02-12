import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MobileSelect } from '@/components/ui/mobile-select';
import { Card } from '@/components/ui/card';
import { Dumbbell, Loader2, CheckCircle2, Upload, Plus, Search, MapPin, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function GymSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [ghostGym, setGhostGym] = useState(null);
  const [showGhostGymModal, setShowGhostGymModal] = useState(false);
  const [checkingGhostGym, setCheckingGhostGym] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    google_place_id: '',
    latitude: null,
    longitude: null,
    address: '',
    city: '',
    postcode: '',
    type: 'general',
    language: 'en',
    price: '',
    amenities: [],
    equipment: [],
    specializes_in: [],
    reward_offer: '',
    image_url: ''
  });

  const queryClient = useQueryClient();

  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Auto-refetch on mount to get latest user data
  React.useEffect(() => {
    refetchUser();
  }, []);

  const createGymMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      
      // Update user account type to gym_owner and mark onboarding as complete
      await base44.auth.updateMe({ 
        account_type: 'gym_owner',
        onboarding_completed: true 
      });
      
      // Generate unique join code
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
          
          // Check if code already exists
          const existing = await base44.entities.Gym.filter({ join_code: code });
          isUnique = existing.length === 0;
          attempts++;
        }

        return code;
      };

      const joinCode = await generateCode();
      
      // Auto-detect language based on city if not set
      const gymLanguage = data.language || detectLanguageFromCity(data.city);
      const gym = await base44.entities.Gym.create({
        ...data,
        language: gymLanguage,
        owner_email: user.email,
        join_code: joinCode,
        verified: false,
        admin_id: user.id,
        claim_status: 'claimed',
        status: 'pending'
      });

      // Create gym membership for the owner
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      setSubmitted(true);
      toast.success('Your gym has been registered!');
    },
    onError: (error) => {
      console.error('Gym registration error:', error);
      toast.error(error?.message || 'Failed to register gym. Please try again.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createGymMutation.mutate(formData);
  };

  const amenitiesOptions = ['WiFi', 'Parking', '24/7', 'Personal Training', 'Showers', 'Lockers', 'Sauna', 'Smoothie Bar'];
  const specializationOptions = ['Weight Loss', 'Muscle Gain', 'Bulking Programs', 'Strength Training', 'Powerlifting', 'Bodybuilding', 'CrossFit', 'HIIT', 'Cardio', 'Rehabilitation'];
  
  const equipmentOptions = [
    // Hammer Strength
    'Hammer Strength Chest Press',
    'Hammer Strength Iso-Lateral Row',
    'Hammer Strength Leg Press',
    'Hammer Strength Shoulder Press',
    'Hammer Strength Decline Press',
    'Hammer Strength Incline Press',
    'Hammer Strength Leg Curl',
    'Hammer Strength Seated Leg Curl',
    'Hammer Strength Ground Base Combo Rack',
    'Hammer Strength V-Squat',
    
    // Life Fitness
    'Life Fitness Smith Machine',
    'Life Fitness Cable Crossover',
    'Life Fitness Treadmill',
    'Life Fitness Elliptical',
    'Life Fitness Bike',
    'Life Fitness Leg Press',
    'Life Fitness Chest Press',
    'Life Fitness Shoulder Press',
    'Life Fitness Lat Pulldown',
    'Life Fitness Row Machine',
    
    // Rogue
    'Rogue Power Rack',
    'Rogue Ohio Bar',
    'Rogue Echo Bike',
    'Rogue Monster Rack',
    'Rogue Squat Stand',
    'Rogue Kettlebells',
    'Rogue Dumbbells',
    'Rogue Bench Press',
    'Rogue Monster Lite Rack',
    'Rogue Adjustable Bench',
    'Rogue Bumper Plates',
    'Rogue Rig',
    
    // Eleiko
    'Eleiko Competition Plates',
    'Eleiko Powerlifting Bar',
    'Eleiko Olympic Barbell',
    'Eleiko Training Plates',
    'Eleiko Squat Rack',
    'Eleiko Competition Bench',
    'Eleiko Powerlifting Combo',
    
    // Technogym
    'Technogym Treadmill',
    'Technogym Elliptical',
    'Technogym Bike',
    'Technogym Cross Trainer',
    'Technogym Leg Press',
    'Technogym Chest Press',
    'Technogym Lat Machine',
    'Technogym Cable Machine',
    'Technogym Kinesis',
    'Technogym Skillmill',
    
    // Concept2
    'Concept2 Rowing Machine',
    'Concept2 BikeErg',
    'Concept2 SkiErg',
    
    // Prime Fitness
    'Prime Fitness Lateral Raise',
    'Prime Fitness Single Leg Press',
    'Prime Fitness Prone Leg Curl',
    'Prime Fitness Chest Press',
    'Prime Fitness Shoulder Press',
    'Prime Fitness Row',
    'Prime Fitness Hack Squat',
    
    // Nautilus
    'Nautilus Chest Fly Machine',
    'Nautilus Leg Curl',
    'Nautilus Leg Extension',
    'Nautilus Pullover Machine',
    'Nautilus Lat Pulldown',
    'Nautilus Chest Press',
    'Nautilus Shoulder Press',
    'Nautilus Abdominal Crunch',
    'Nautilus Low Row',
    
    // Matrix
    'Matrix Hack Squat',
    'Matrix Leg Press',
    'Matrix Chest Press',
    'Matrix Shoulder Press',
    'Matrix Lat Pulldown',
    'Matrix Cable Crossover',
    'Matrix Treadmill',
    
    // Cybex
    'Cybex Arc Trainer',
    'Cybex Leg Extension',
    'Cybex Leg Curl',
    'Cybex Chest Press',
    'Cybex Shoulder Press',
    'Cybex Row Machine',
    'Cybex Treadmill',
    'Cybex VR3 Leg Press',
    
    // Precor
    'Precor Chest Press',
    'Precor Shoulder Press',
    'Precor Treadmill',
    'Precor Elliptical',
    'Precor Bike',
    'Precor AMT',
    'Precor Leg Press',
    'Precor Lat Pulldown',
    
    // Titan Fitness
    'Titan Fitness Lat Pulldown',
    'Titan Fitness Leg Press',
    'Titan Fitness Power Rack',
    'Titan Fitness T-3 Series Rack',
    'Titan Fitness Olympic Barbell',
    'Titan Fitness Dumbbells',
    'Titan Fitness Adjustable Bench',
    
    // Arsenal Strength
    'Arsenal Strength Chest Press',
    'Arsenal Strength Squat Rack',
    'Arsenal Strength Leg Press',
    'Arsenal Strength Shoulder Press',
    'Arsenal Strength Seated Row',
    'Arsenal Strength Pulldown',
    
    // Sorinex
    'Sorinex Bench Press',
    'Sorinex Dumbbell Rack',
    'Sorinex Power Rack',
    'Sorinex Jammer Arms',
    'Sorinex Olympic Platform',
    
    // Watson
    'Watson Adjustable Bench',
    'Watson Olympic Platform',
    'Watson Power Rack',
    'Watson Dumbbells',
    
    // York
    'York Barbell Set',
    'York Dumbbells',
    'York Power Rack',
    'York Bench Press',
    'York Olympic Plates',
    
    // Ivanko
    'Ivanko Weight Plates',
    'Ivanko Dumbbells',
    'Ivanko Olympic Barbell',
    
    // Bells of Steel
    'Bells of Steel Power Rack',
    'Bells of Steel Cable Machine',
    'Bells of Steel Bumper Plates',
    'Bells of Steel Bench',
    
    // Gym80
    'Gym80 Chest Supported Row',
    'Gym80 Shoulder Press',
    'Gym80 Leg Press',
    'Gym80 Chest Press',
    
    // Keiser
    'Keiser Strength Equipment',
    'Keiser Functional Trainer',
    'Keiser Air Bike',
    'Keiser M3i Bike',
    'Keiser Half Rack',
    
    // StairMaster
    'StairMaster Stepmill',
    'StairMaster Gauntlet',
    'StairMaster Bike',
    'StairMaster 4G',
    
    // FreeMotion
    'FreeMotion Cable Crossover',
    'FreeMotion Dual Cable Cross',
    'FreeMotion Chest Press',
    'FreeMotion Leg Press',
    'FreeMotion Functional Trainer',
    
    // Other Popular Brands
    'Assault Bike',
    'Assault AirRunner',
    'Assault Fitness AirBike Elite',
    'Body-Solid Power Rack',
    'Body-Solid Leg Press',
    'Body-Solid Cable Crossover',
    'Bowflex SelectTech Dumbbells',
    'Schwinn Airdyne Bike',
    'True Fitness Treadmill',
    'Star Trac Treadmill',
    'Hoist Fitness Cable Machine',
    'Hoist Fitness Leg Press',
    'Rep Fitness Power Rack',
    'Rep Fitness Bench',
    'Force USA Cable Machine',
    'Force USA Power Rack',
    'Ironmaster Dumbbells',
    'PowerBlock Dumbbells',
    'American Barbell Plates',
    'Vulcan Strength Bumper Plates',
    'Fringe Sport Bumper Plates',
    'Torque Fitness Tank',
    'Marpo Rope Trainer',
    'Versaclimber',
    'Jacobs Ladder',
    'SkillMill',
    'Woodway Treadmill',
    'Woodway Curve Treadmill',
    'WaterRower',
    'TRX Suspension Trainer',
    'Battle Ropes',
    'Plyo Boxes',
    'GHD Machine',
    'Reverse Hyper',
    'Belt Squat Machine',
    'Sissy Squat Machine',
    'Calf Raise Machine',
    'Hip Thrust Machine',
    'Glute Ham Developer',
    'Leg Extension Machine',
    'Leg Curl Machine',
    'Smith Machine',
    'Cable Crossover Station',
    'Functional Trainer',
    'Lat Pulldown Machine',
    'Seated Row Machine',
    'T-Bar Row',
    'Chest Fly Machine',
    'Pec Deck Machine',
    'Dip Station',
    'Pull-Up Station',
    'Preacher Curl Bench',
    'Decline Bench',
    'Incline Bench',
    'Flat Bench',
    'Adjustable Bench',
    'Olympic Bench Press',
    'Competition Bench Press',
    'Squat Rack',
    'Half Rack',
    'Full Rack',
    'Monkey Bars',
    'Dumbbell Set (5-100 lbs)',
    'Kettlebell Set',
    'Medicine Balls',
    'Slam Balls',
    'Wall Balls',
    'Resistance Bands',
    'Olympic Barbells',
    'EZ Curl Bar',
    'Trap Bar',
    'Safety Squat Bar',
    'Log Press Bar',
    'Swiss Bar',
    'Football Bar',
    'Cambered Bar',
    'Bumper Plates',
    'Iron Plates',
    'Competition Plates',
    'Fractional Plates',
    'Weight Trees',
    'Plate Storage',
    'Dumbbell Rack',
    'Kettlebell Rack',
    'Barbell Rack',
    'Foam Rollers',
    'Ab Wheels',
    'Yoga Mats',
    'Exercise Balls',
    'Bosu Balls',
    'Landmine Attachment',
    'Sled',
    'Prowler Sled',
    'Boxing Heavy Bag',
    'Speed Bag',
    'Boxing Ring',
    'Agility Ladder',
    'Hurdles',
    'Turf Area',
    'Olympic Lifting Platform',
    'Deadlift Platform',
    'Rubber Flooring',
    'Mirrors',
    'Sound System',
    'Fans',
    'Air Conditioning'
  ];

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const addCustomEquipment = () => {
    if (customEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, customEquipment.trim()]
      }));
      setCustomEquipment('');
    }
  };

  const filteredEquipment = equipmentOptions.filter(eq => 
    eq.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const ukCities = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 
    'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Leicester', 'Nottingham',
    'Cardiff', 'Belfast', 'Brighton', 'Southampton', 'Oxford', 'Cambridge'
  ];

  const detectLanguageFromCity = (city) => {
    const spanishCities = ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'];
    return spanishCities.some(sc => city?.includes(sc)) ? 'es' : 'en';
  };

  const searchGooglePlaces = async (query) => {
    if (!query || query.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    try {
      const response = await base44.functions.invoke('searchGymsPlaces', { 
        query,
        type: 'gym' 
      });
      setPlaceSuggestions(response.data.places || []);
    } catch (error) {
      console.error('Error searching places:', error);
      setPlaceSuggestions([]);
    }
  };

  const handleSelectPlace = async (place) => {
    setCheckingGhostGym(true);
    setSelectedPlace(place);
    setPlaceSearch(place.name);
    setShowPlaceSuggestions(false);

    try {
      // Check if there's an existing ghost gym with this google_place_id
      const existingGyms = await base44.entities.Gym.filter({ 
        google_place_id: place.place_id 
      });

      const ghostGymMatch = existingGyms.find(gym => gym.claim_status === 'unclaimed');

      if (ghostGymMatch) {
        // Found a ghost gym - show modal to claim it
        setGhostGym(ghostGymMatch);
        setShowGhostGymModal(true);
      } else {
        // No ghost gym - proceed with creating official gym
        setFormData(prev => ({
          ...prev,
          name: place.name.slice(0, 15),
          google_place_id: place.place_id,
          latitude: place.latitude,
          longitude: place.longitude,
          address: place.address || '',
          city: place.city || '',
          postcode: place.postcode || ''
        }));
      }
    } catch (error) {
      console.error('Error checking for ghost gym:', error);
      // If check fails, proceed with creating official gym
      setFormData(prev => ({
        ...prev,
        name: place.name.slice(0, 15),
        google_place_id: place.place_id,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address || '',
        city: place.city || '',
        postcode: place.postcode || ''
      }));
    } finally {
      setCheckingGhostGym(false);
    }
  };

  const handleClaimGhostGym = () => {
    if (ghostGym) {
      // Navigate to the ClaimGym page with the gym ID
      navigate(createPageUrl('ClaimGym') + `?gymId=${ghostGym.id}`);
    }
  };

  const handleCreateOfficialGym = () => {
    // User chose to create an official gym instead of claiming ghost gym
    setFormData(prev => ({
      ...prev,
      name: selectedPlace.name.slice(0, 15),
      google_place_id: selectedPlace.place_id,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      address: selectedPlace.address || '',
      city: selectedPlace.city || '',
      postcode: selectedPlace.postcode || ''
    }));
    setShowGhostGymModal(false);
    setGhostGym(null);
  };



  // Temporarily disabled access check for testing
  // if (currentUser && currentUser.account_type !== 'gym_owner') {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
  //       <Card className="max-w-md w-full p-8 text-center">
  //         <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //           <Dumbbell className="w-12 h-12 text-red-600" />
  //         </div>
  //         <h2 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h2>
  //         <p className="text-gray-600 mb-6">
  //           Only gym owner accounts can register gyms. Please create a gym owner account during onboarding.
  //         </p>
  //         <Button 
  //           onClick={() => window.location.href = '/'}
  //           className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12"
  //         >
  //           Back to Home
  //         </Button>
  //       </Card>
  //     </div>
  //   );
  // }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700/50">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Registration Successful!</h2>
          <p className="text-slate-300 mb-6">
            Your gym has been submitted for review. We'll verify your details and get back to you within 24 hours.
          </p>
          <Button 
            onClick={() => window.location.href = createPageUrl('GymOwnerDashboard')}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Register Your Gym</h1>
          <p className="text-slate-300">Join our community and now build yours</p>
        </div>

        <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            <div className={step === 1 ? '' : 'hidden'}>
              <h3 className="text-xl font-bold text-white mb-4">Account & Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-white font-semibold">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@gym.com"
                    required
                    className="mt-1 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-white font-semibold">Password *</Label>
                    <a
                      href="/auth/login"
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="mt-1 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                  />
                </div>

                <div className="relative">
                  <Label className="text-white font-semibold">Search Your Gym *</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      value={placeSearch}
                      onChange={(e) => {
                        setPlaceSearch(e.target.value);
                        setShowPlaceSuggestions(true);
                        searchGooglePlaces(e.target.value);
                      }}
                      onFocus={() => setShowPlaceSuggestions(true)}
                      placeholder="Search gym name or address..."
                      className="mt-0 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white pl-9"
                    />
                  </div>
                  {showPlaceSuggestions && placeSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border-2 border-slate-600 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
                      {placeSuggestions.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlace(place)}
                          className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 first:rounded-t-2xl last:rounded-b-2xl transition-colors border-b border-slate-700 last:border-0 flex items-start gap-2"
                        >
                          <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-medium">{place.name}</div>
                            <div className="text-xs text-slate-400">{place.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {checkingGhostGym && (
                    <div className="mt-2 p-2.5 bg-blue-500/20 border border-blue-500/40 rounded-lg flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                      <p className="text-xs text-blue-300 font-medium">Checking for existing gym...</p>
                    </div>
                  )}
                  {selectedPlace && !checkingGhostGym && (
                    <div className="mt-2 p-2.5 bg-green-500/20 border border-green-500/40 rounded-lg">
                      <p className="text-xs text-green-300 font-medium">✓ Gym location selected</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-white font-semibold">Gym Type *</Label>
                  <MobileSelect 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    placeholder="Select gym type"
                    triggerClassName="mt-1 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                    options={[
                      { value: 'general', label: 'General Fitness' },
                      { value: 'powerlifting', label: 'Powerlifting' },
                      { value: 'bodybuilding', label: 'Bodybuilding' },
                      { value: 'crossfit', label: 'CrossFit' },
                      { value: 'boxing', label: 'Boxing' },
                      { value: 'mma', label: 'MMA' }
                    ]}
                  />
                </div>

                <div>
                   <Label className="text-white font-semibold">Community Language *</Label>
                   <MobileSelect 
                     value={formData.language} 
                     onValueChange={(value) => setFormData({ ...formData, language: value })}
                     placeholder="Select language"
                     triggerClassName="mt-1 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                     options={[
                       { value: 'en', label: '🇬🇧 English' },
                       { value: 'es', label: '🇪🇸 Español' }
                     ]}
                   />
                   <p className="text-xs text-slate-400 mt-1">Language for your gym's community</p>
                 </div>
              </div>

              <Button
               type="button"
               onClick={() => setStep(2)}
               disabled={!formData.email || !formData.password || !selectedPlace || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
               className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
               Next Step
              </Button>
            </div>

            {/* Step 2: Amenities & Equipment */}
            <div className={step === 2 ? '' : 'hidden'}>
              <h3 className="text-xl font-bold text-white mb-4">Gym Specializations & Details</h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-white font-semibold mb-2 block">Gym Specializations</Label>
                  <p className="text-sm text-slate-300 mb-3">What does your gym specialize in? (Select all that apply)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {specializationOptions.map((spec) => (
                      <Button
                        key={spec}
                        type="button"
                        onClick={() => toggleArrayItem('specializes_in', spec)}
                        variant={formData.specializes_in.includes(spec) ? 'default' : 'outline'}
                        className={`rounded-2xl ${
                          formData.specializes_in.includes(spec)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : ''
                        }`}
                      >
                        {spec}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white font-semibold mb-2 block">Amenities</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {amenitiesOptions.map((amenity) => (
                      <Button
                        key={amenity}
                        type="button"
                        onClick={() => toggleArrayItem('amenities', amenity)}
                        variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
                        className="rounded-2xl"
                      >
                        {amenity}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-white font-semibold mb-2 block">Gym Equipment</Label>
                  <p className="text-sm text-slate-300 mb-3">Select equipment or add your own</p>
                  
                  {/* Custom Equipment Input */}
                  <div className="mb-3 flex gap-2">
                    <Input
                      value={customEquipment}
                      onChange={(e) => setCustomEquipment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEquipment())}
                      placeholder="Type custom equipment name..."
                      className="rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                    />
                    <Button
                      type="button"
                      onClick={addCustomEquipment}
                      className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Search Box */}
                  <Input
                    value={equipmentSearch}
                    onChange={(e) => setEquipmentSearch(e.target.value)}
                    placeholder="Search equipment..."
                    className="mb-3 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                  />

                  {/* Equipment List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-2 border-2 border-slate-600 rounded-2xl bg-slate-900/30">
                    {filteredEquipment.map((equipment) => (
                      <Button
                        key={equipment}
                        type="button"
                        onClick={() => toggleArrayItem('equipment', equipment)}
                        variant={formData.equipment.includes(equipment) ? 'default' : 'outline'}
                        className={`rounded-xl text-left justify-start h-auto py-3 ${
                          formData.equipment.includes(equipment)
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                            : ''
                        }`}
                        size="sm"
                      >
                        {equipment}
                      </Button>
                    ))}
                    {filteredEquipment.length === 0 && (
                      <p className="col-span-2 text-center text-slate-400 py-4">No equipment found</p>
                    )}
                  </div>

                  {/* Selected Count */}
                  {formData.equipment.length > 0 && (
                    <div className="mt-3 p-3 bg-green-500/20 border-2 border-green-500/40 rounded-2xl">
                      <p className="text-sm font-bold text-green-300 mb-2">
                        ✓ {formData.equipment.length} equipment item{formData.equipment.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.equipment.map((item, idx) => (
                          <Badge 
                            key={idx} 
                            className="bg-green-600 text-white cursor-pointer hover:bg-red-500 transition-colors"
                            onClick={() => toggleArrayItem('equipment', item)}
                          >
                            {item} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-white font-semibold">Special Offer</Label>
                  <Input
                    value={formData.reward_offer}
                    onChange={(e) => setFormData({ ...formData, reward_offer: e.target.value })}
                    placeholder="£5 Free Day Pass"
                    className="mt-1 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">Attract new members with a special offer</p>
                </div>

                <div>
                  <Label className="text-white font-semibold">Gym Image URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 rounded-2xl border-2 border-slate-600 bg-slate-700/50 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl h-12 font-semibold bg-slate-700 hover:bg-slate-600 text-white border-0"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createGymMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12"
                >
                  {createGymMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Register Gym'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Ghost Gym Found Modal */}
        {showGhostGymModal && ghostGym && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 bg-slate-900/95 backdrop-blur-xl border-2 border-amber-500/50">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Ghost Gym Found!</h3>
                <p className="text-slate-300 text-sm">
                  This gym already exists in our system but hasn't been claimed yet.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-white mb-2">{ghostGym.name}</h4>
                <div className="space-y-1 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{ghostGym.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-3 h-3" />
                    <span>{ghostGym.members_count || 0} members</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleClaimGhostGym}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl h-12"
              >
                Claim This Gym
              </Button>

              <p className="text-xs text-slate-500 text-center mt-4">
                Claiming will preserve existing members and activity
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}