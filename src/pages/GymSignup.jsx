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
import ManageEquipmentModal from '../components/gym/ManageEquipmentModal';

export default function GymSignup() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postcode: '',
    type: 'general',
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
      return base44.entities.Gym.create({
        ...data,
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

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSaveEquipment = (equipment) => {
    setFormData({ ...formData, equipment });
    setShowEquipmentModal(false);
  };

  // Redirect if not gym owner
  if (currentUser && currentUser.account_type !== 'gym_owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            Only gym owner accounts can register gyms. Please create a gym owner account during onboarding.
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h3>
              
              <div className="space-y-4">
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
                  <div>
                    <Label className="text-gray-700 font-semibold">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="London"
                      required
                      className="mt-1 rounded-2xl border-2 border-gray-200"
                    />
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
                  <Label className="text-gray-700 font-semibold mb-2 block">Specific Equipment</Label>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-3">
                    <p className="text-sm text-blue-900 font-medium mb-1">
                      List your exact equipment with brands and models
                    </p>
                    <p className="text-xs text-blue-700">
                      e.g., "Hammer Strength Chest Supported Row", "Prime Lateral Raise Machine"
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowEquipmentModal(true)}
                    variant="outline"
                    className="w-full rounded-2xl border-2 border-dashed border-blue-300 hover:bg-blue-50 h-12"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {formData.equipment.length > 0 ? `Manage Equipment (${formData.equipment.length})` : 'Add Equipment'}
                  </Button>
                  {formData.equipment.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.equipment.slice(0, 5).map((item, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-900 border-purple-200">
                          {item}
                        </Badge>
                      ))}
                      {formData.equipment.length > 5 && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600">
                          +{formData.equipment.length - 5} more
                        </Badge>
                      )}
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

        <ManageEquipmentModal
          open={showEquipmentModal}
          onClose={() => setShowEquipmentModal(false)}
          equipment={formData.equipment}
          onSave={handleSaveEquipment}
        />
      </div>
    </div>
  );
}