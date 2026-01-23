import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dumbbell, Loader2, CheckCircle2, Upload, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function GymSignup() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
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
      
      // Update user account type to gym_owner
      await base44.auth.updateMe({ account_type: 'gym_owner' });
      
      // Auto-detect language based on city if not set
      const gymLanguage = data.language || detectLanguageFromCity(data.city);
      return base44.entities.Gym.create({
        ...data,
        language: gymLanguage,
        owner_email: user.email,
        verified: false,
        rating: 0,
        members_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setSubmitted(true);
      toast.success('Your gym has been registered!');
    },
    onError: (error) => {
      toast.error('Failed to register gym. Please try again.');
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

  const filteredCities = ukCities.filter(city =>
    city.toLowerCase().includes(addressSearch.toLowerCase())
  );

  const detectLanguageFromCity = (city) => {
    const spanishCities = ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'];
    return spanishCities.some(sc => city?.includes(sc)) ? 'es' : 'en';
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your gym has been submitted for review. We'll verify your details and get back to you within 24 hours.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12"
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Register Your Gym</h1>
          <p className="text-gray-600">Join our community and attract new members</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            <div className={step === 1 ? '' : 'hidden'}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Account & Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-semibold">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@gym.com"
                    required
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-gray-700 font-semibold">Password *</Label>
                    <a
                      href="/auth/login"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
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
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">Gym Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Iron Paradise Gym"
                    required
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">Address *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Muscle Street"
                    required
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label className="text-gray-700 font-semibold">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => {
                        setFormData({ ...formData, city: e.target.value });
                        setAddressSearch(e.target.value);
                        setShowAddressSuggestions(true);
                      }}
                      onFocus={() => setShowAddressSuggestions(true)}
                      placeholder="London"
                      required
                      className="mt-1 rounded-2xl border-2 border-gray-200"
                    />
                    {showAddressSuggestions && addressSearch && filteredCities.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredCities.map(city => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, city });
                              setShowAddressSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 first:rounded-t-2xl last:rounded-b-2xl transition-colors"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold">Postcode</Label>
                    <Input
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      placeholder="SW1A 1AA"
                      className="mt-1 rounded-2xl border-2 border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">Gym Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="mt-1 rounded-2xl border-2 border-gray-200">
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

                <div>
                  <Label className="text-gray-700 font-semibold">Community Language *</Label>
                  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                    <SelectTrigger className="mt-1 rounded-2xl border-2 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">Language for your gym's community</p>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">Monthly Price (£)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="29.99"
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-2xl h-12"
              >
                Next Step
              </Button>
            </div>

            {/* Step 2: Amenities & Equipment */}
            <div className={step === 2 ? '' : 'hidden'}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Gym Specializations & Details</h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Gym Specializations</Label>
                  <p className="text-sm text-gray-600 mb-3">What does your gym specialize in? (Select all that apply)</p>
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
                  <Label className="text-gray-700 font-semibold mb-2 block">Amenities</Label>
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
                  <Label className="text-gray-700 font-semibold mb-2 block">Gym Equipment</Label>
                  <p className="text-sm text-gray-600 mb-3">Select equipment or add your own</p>
                  
                  {/* Custom Equipment Input */}
                  <div className="mb-3 flex gap-2">
                    <Input
                      value={customEquipment}
                      onChange={(e) => setCustomEquipment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEquipment())}
                      placeholder="Type custom equipment name..."
                      className="rounded-2xl border-2 border-gray-200"
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
                    className="mb-3 rounded-2xl border-2 border-gray-200"
                  />

                  {/* Equipment List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-2 border-2 border-gray-200 rounded-2xl">
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
                      <p className="col-span-2 text-center text-gray-500 py-4">No equipment found</p>
                    )}
                  </div>

                  {/* Selected Count */}
                  {formData.equipment.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-2xl">
                      <p className="text-sm font-bold text-green-900 mb-2">
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
                  <Label className="text-gray-700 font-semibold">Special Offer</Label>
                  <Input
                    value={formData.reward_offer}
                    onChange={(e) => setFormData({ ...formData, reward_offer: e.target.value })}
                    placeholder="£5 Free Day Pass"
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">Attract new members with a special offer</p>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold">Gym Image URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 rounded-2xl border-2 border-gray-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 rounded-2xl h-12 font-semibold"
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
      </div>
    </div>
  );
}