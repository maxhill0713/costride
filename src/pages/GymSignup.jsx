import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dumbbell, Loader2, CheckCircle2, Search, MapPin, AlertCircle,
  ArrowRight, Building2, Star, Users, Trophy, Zap, ChevronRight,
  Bell, Mail, Instagram, Shield, Sparkles, Plus, X
} from 'lucide-react';
import { toast } from 'sonner';

const PREVIEW_SLIDES = [
  {
    icon: Users, color: 'from-blue-400 to-cyan-500',
    title: 'Build Your Community',
    description: 'Members check in, connect with each other, and stay motivated — all in one place.',
  },
  {
    icon: Trophy, color: 'from-purple-400 to-pink-500',
    title: 'Run Challenges',
    description: 'Create leaderboards, weekly challenges and reward your most active members.',
  },
  {
    icon: Zap, color: 'from-orange-400 to-yellow-500',
    title: 'Instant Insights',
    description: "See who's training, peak hours, retention rates and more on your dashboard.",
  },
  {
    icon: Bell, color: 'from-green-400 to-emerald-500',
    title: 'Keep Members Engaged',
    description: 'Send announcements, polls and challenges directly to your members.',
  }
];

const PRESET_EQUIPMENT = [
  'Barbells', 'Dumbbells', 'Kettlebells', 'Cable Machines',
  'Smith Machine', 'Leg Press', 'Pull Up Bars', 'Bench Press',
  'Squat Rack', 'Treadmills', 'Rowing Machines', 'Battle Ropes',
  'Resistance Bands', 'Foam Rollers', 'Boxing Bags', 'Assault Bike',
  'Hack Squat', 'Lat Pulldown', 'Chest Fly Machine', 'Stair Climber'
];

const AMENITIES_OPTIONS = ['WiFi', 'Parking', '24/7', 'Personal Training', 'Showers', 'Lockers', 'Sauna', 'Smoothie Bar'];

const SPECIALIZATION_OPTIONS = [
  'Weight Loss', 'Muscle Gain', 'Bulking Programs', 'Strength Training',
  'Powerlifting', 'Bodybuilding', 'CrossFit', 'HIIT', 'Cardio', 'Rehabilitation'
];

const GYM_TYPES = [
  { value: 'general', label: 'General Fitness' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'bodybuilding', label: 'Bodybuilding' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'mma', label: 'MMA' }
];

function StepHeader({ step, title, subtitle }) {
  return (
    <div className="text-center mb-6 flex flex-col items-center gap-3">
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
        alt="CoStride"
        className="w-14 h-14 rounded-2xl object-cover shadow-xl border border-white/20"
      />
      <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">{step}</span>
      </div>
      <h1 className="text-3xl font-black text-white">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm text-center">{subtitle}</p>}
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center py-6 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md w-full relative z-10">{children}</div>
    </div>
  );
}

export default function GymSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);

  const [formData, setFormData] = useState({
    name: '', google_place_id: '', latitude: null, longitude: null,
    address: '', city: '', postcode: '', type: 'general', language: 'en',
    amenities: [], equipment: [], specializes_in: [], description: ''
  });

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [ghostGym, setGhostGym] = useState(null);
  const [showGhostGymModal, setShowGhostGymModal] = useState(false);
  const [createdGym, setCreatedGym] = useState(null);

  // Equipment search state
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentSuggestions, setEquipmentSuggestions] = useState([]);

  const [verificationMethod, setVerificationMethod] = useState('email');
  const [businessEmail, setBusinessEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [instagramCode] = useState(() => 'CSTR-' + Math.random().toString(36).substring(2, 7).toUpperCase());

  const queryClient = useQueryClient();

  useEffect(() => {
    if (step !== 1) return;
    const timer = setInterval(() => setSlideIndex(prev => (prev + 1) % PREVIEW_SLIDES.length), 3000);
    return () => clearInterval(timer);
  }, [step]);

  // Equipment search — filter presets + allow custom
  useEffect(() => {
    if (!equipmentSearch.trim()) { setEquipmentSuggestions([]); return; }
    const query = equipmentSearch.toLowerCase();
    const filtered = PRESET_EQUIPMENT.filter(e =>
      e.toLowerCase().includes(query) && !formData.equipment.includes(e)
    );
    // If typed text doesn't exactly match a preset, add "Add X" option
    const exactMatch = PRESET_EQUIPMENT.some(e => e.toLowerCase() === query);
    const alreadyAdded = formData.equipment.some(e => e.toLowerCase() === query);
    if (!exactMatch && !alreadyAdded && equipmentSearch.trim().length > 1) {
      filtered.push(`__custom__${equipmentSearch.trim()}`);
    }
    setEquipmentSuggestions(filtered);
  }, [equipmentSearch, formData.equipment]);

  const addEquipment = (item) => {
    const value = item.startsWith('__custom__') ? item.replace('__custom__', '') : item;
    if (!formData.equipment.includes(value)) {
      setFormData(prev => ({ ...prev, equipment: [...prev.equipment, value] }));
    }
    setEquipmentSearch('');
    setEquipmentSuggestions([]);
  };

  const removeEquipment = (item) => {
    setFormData(prev => ({ ...prev, equipment: prev.equipment.filter(e => e !== item) }));
  };

  const generateQR = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById('qr-container');
      if (el && createdGym?.join_code) {
        el.innerHTML = '';
        new window.QRCode(el, {
          text: `https://costride.app/join/${createdGym.join_code}`,
          width: 180, height: 180,
          colorDark: '#ffffff', colorLight: '#1e3a5f',
          correctLevel: window.QRCode.CorrectLevel.H
        });
      }
    }, 300);
  }, [createdGym]);

  useEffect(() => {
    if (step !== 7 || !createdGym?.join_code) return;
    const existing = document.getElementById('qrcode-script');
    if (existing) { generateQR(); return; }
    const script = document.createElement('script');
    script.id = 'qrcode-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => generateQR();
    document.head.appendChild(script);
  }, [step, createdGym, generateQR]);

  const detectLanguageFromCity = (city) => {
    const spanishCities = ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'];
    return spanishCities.some(sc => city?.includes(sc)) ? 'es' : 'en';
  };

  const searchGooglePlaces = async (query) => {
    if (!query.trim() || query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const response = await base44.functions.invoke('searchGymsPlaces', { input: query });
      setSearchResults(response.data.results || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleSelectPlace = async (place) => {
    setSelectedPlace(place);
    setSearchInput(place.name);
    setSearchResults([]);
    try {
      const existingGyms = await base44.entities.Gym.filter({ google_place_id: place.place_id });
      const ghostGymMatch = existingGyms.find(gym => gym.claim_status === 'unclaimed');
      if (ghostGymMatch) {
        setGhostGym(ghostGymMatch);
        setShowGhostGymModal(true);
      } else {
        setFormData(prev => ({
          ...prev, name: place.name, google_place_id: place.place_id,
          latitude: place.latitude, longitude: place.longitude,
          address: place.address || '', city: place.city || '', postcode: place.postcode || ''
        }));
      }
    } catch {
      setFormData(prev => ({
        ...prev, name: place.name, google_place_id: place.place_id,
        latitude: place.latitude, longitude: place.longitude,
        address: place.address || '', city: place.city || '', postcode: place.postcode || ''
      }));
    }
  };

  const handleClaimGhostGym = () => {
    if (!ghostGym) return;
    setFormData(prev => ({
      ...prev, name: ghostGym.name, google_place_id: ghostGym.google_place_id,
      latitude: ghostGym.latitude, longitude: ghostGym.longitude,
      address: ghostGym.address || '', city: ghostGym.city || '',
      postcode: ghostGym.postcode || '', type: ghostGym.type || 'general',
      amenities: ghostGym.amenities || [], equipment: ghostGym.equipment || [],
      specializes_in: ghostGym.specializes_in || [], claimingGymId: ghostGym.id
    }));
    setShowGhostGymModal(false);
    toast.success('Gym found! Complete signup to claim it.');
  };

  const handleSendCode = async () => {
    if (!businessEmail) return;
    setSendingCode(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      await base44.functions.invoke('sendEmail', {
        to: businessEmail,
        subject: 'Your CoStride Verification Code',
        body: `Hi,\n\nYour CoStride gym verification code is:\n\n${code}\n\nEnter this code to verify ownership of ${formData.name}.\n\nThis code expires in 10 minutes.\n\n— The CoStride Team`
      });
      setCodeSent(true);
      toast.success(`Code sent to ${businessEmail}`);
    } catch {
      toast.error('Failed to send code. Please check the email and try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    setVerifyingCode(true);
    await new Promise(r => setTimeout(r, 600));
    if (enteredCode === generatedCode) {
      setEmailVerified(true);
      toast.success("Email verified! Your gym will go live instantly.");
    } else {
      toast.error('Incorrect code. Please try again.');
    }
    setVerifyingCode(false);
  };

  const createGymMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();

      await base44.auth.updateMe({
        account_type: 'gym_owner',
        onboarding_completed: true
      });

      const gymLanguage = detectLanguageFromCity(data.city);
      const isVerified = emailVerified;

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));

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
          description: data.description,
          claim_status: 'claimed',
          status: isVerified ? 'approved' : 'pending',
          verified: isVerified
        });
      } else {
        gym = await base44.entities.Gym.create({
          name: data.name,
          google_place_id: data.google_place_id || '',
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address || '',
          city: data.city || '',
          postcode: data.postcode || '',
          type: data.type || 'general',
          language: gymLanguage,
          description: data.description || '',
          amenities: data.amenities || [],
          equipment: data.equipment || [],
          specializes_in: data.specializes_in || [],
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
      toast.success('Gym registered successfully!');
      setCreatedGym(gym);
      setStep(7);
    },
    onError: (error) => {
      console.error('Gym creation error:', error);
      toast.error(error?.message || 'Failed to register gym. Please try again.');
    }
  });

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const submitGym = () => {
    if (!formData.name) {
      toast.error('Please select a gym first.');
      setStep(2);
      return;
    }
    createGymMutation.mutate(formData);
  };

  const slide = PREVIEW_SLIDES[slideIndex];
  const SlideIcon = slide.icon;

  // ─── STEP 1: Preview Slides ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex flex-col items-center justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 opacity-80" />
        <div className="w-full flex justify-end relative z-10 pt-2">
          <button onClick={() => setStep(2)} className="text-slate-400 text-sm font-semibold hover:text-white transition-colors">
            Skip →
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center max-w-sm">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-2xl transition-all duration-500`}>
            <SlideIcon className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 leading-tight">{slide.title}</h2>
          <p className="text-slate-300 text-base leading-relaxed">{slide.description}</p>
        </div>
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {PREVIEW_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all duration-300 ${i === slideIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`} />
            ))}
          </div>
          <button onClick={() => setStep(2)}
            className="w-full h-14 rounded-2xl font-bold text-base text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 2: Find Your Gym ────────────────────────────────────────────────
  if (step === 2) {
    return (
      <PageWrapper>
        <StepHeader step="Step 1 of 4" title="Select Your Gym"
          subtitle="Search for your gym — we'll check if a community already exists" />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); searchGooglePlaces(e.target.value); }}
              placeholder="Search gym name or location..."
              className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 pl-9 h-12" />
            {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
          </div>

          {searchResults.length > 0 && (
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto mb-4">
              {searchResults.slice(0, 8).map((place, idx) => (
                <button key={idx} type="button" onClick={() => handleSelectPlace(place)}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white text-sm truncate">{place.name}</div>
                    <div className="text-xs text-slate-400 truncate">{place.address}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {selectedPlace && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm truncate">{selectedPlace.name}</div>
                <div className="text-xs text-slate-400 truncate">{selectedPlace.address}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
            </div>
          )}

          <div className="mb-5">
            <Label className="text-white font-semibold text-sm mb-2 block">Gym Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {GYM_TYPES.map((type) => (
                <button key={type.value} type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-2 rounded-xl text-xs font-medium transition-all border ${
                    formData.type === type.value
                      ? 'bg-blue-500/30 border-blue-400/60 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => selectedPlace && setStep(3)} disabled={!selectedPlace}
            className={`w-full h-14 rounded-2xl font-bold text-base transition-all duration-100 flex items-center justify-center gap-2 border-b-[5px] ${
              selectedPlace
                ? 'bg-blue-500 border-blue-700 text-white hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2'
                : 'bg-slate-700 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}>
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {showGhostGymModal && ghostGym && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-slate-800/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Community Already Exists!</h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Members have built a community for <span className="font-bold text-white">{ghostGym.name}</span> with{' '}
                <span className="font-bold text-amber-400">{ghostGym.members_count || 0} members</span>. Claim it to take ownership.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{ghostGym.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {ghostGym.members_count || 0} members waiting
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowGhostGymModal(false)}
                  className="flex-1 h-11 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-semibold text-sm transition-all">
                  Cancel
                </button>
                <button onClick={handleClaimGhostGym}
                  className="flex-1 h-11 rounded-2xl bg-blue-500 border-b-[4px] border-blue-700 text-white font-bold text-sm hover:bg-blue-400 active:translate-y-0.5 active:border-b-2 transition-all">
                  Claim It
                </button>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    );
  }

  // ─── STEP 3: Verify Ownership ─────────────────────────────────────────────
  if (step === 3) {
    return (
      <PageWrapper>
        <StepHeader step="Step 2 of 4" title="Verify Ownership"
          subtitle={`Prove you own ${formData.name}`} />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-5">
            <button onClick={() => { setVerificationMethod('email'); setCodeSent(false); setEmailVerified(false); setEnteredCode(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                verificationMethod === 'email' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}>
              <Mail className="w-4 h-4" /> Business Email
            </button>
            <button onClick={() => setVerificationMethod('instagram')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                verificationMethod === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}>
              <Instagram className="w-4 h-4" /> Instagram
            </button>
          </div>

          {verificationMethod === 'email' && (
            <div className="space-y-4">
              {!emailVerified ? (
                <>
                  <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-2xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">How it works</p>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Enter your business email. We'll send a 6-digit code — if you can receive it, you own it.
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white font-semibold text-sm mb-2 block">Business Email</Label>
                    <div className="flex gap-2">
                      <Input type="email" value={businessEmail}
                        onChange={(e) => { setBusinessEmail(e.target.value); setCodeSent(false); setEnteredCode(''); }}
                        placeholder="owner@yourgym.com" disabled={codeSent}
                        className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-12 flex-1 disabled:opacity-60" />
                      <button onClick={handleSendCode} disabled={!businessEmail || sendingCode || codeSent}
                        className="h-12 px-4 rounded-xl bg-blue-500 border-b-[3px] border-blue-700 text-white font-bold text-sm hover:bg-blue-400 active:translate-y-0.5 active:border-b transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
                        {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : codeSent ? 'Sent ✓' : 'Send Code'}
                      </button>
                    </div>
                  </div>
                  {codeSent && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-300">Code sent to <span className="font-semibold">{businessEmail}</span>. Check your inbox.</p>
                      </div>
                      <div>
                        <Label className="text-white font-semibold text-sm mb-2 block">Enter 6-digit Code</Label>
                        <div className="flex gap-2">
                          <Input value={enteredCode}
                            onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000" maxLength={6}
                            className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-12 flex-1 text-center text-xl font-black tracking-widest" />
                          <button onClick={handleVerifyCode} disabled={enteredCode.length !== 6 || verifyingCode}
                            className="h-12 px-4 rounded-xl bg-blue-500 border-b-[3px] border-blue-700 text-white font-bold text-sm hover:bg-blue-400 active:translate-y-0.5 active:border-b transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => { setCodeSent(false); setEnteredCode(''); }}
                        className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
                        Wrong email? Change it →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Email Verified!</p>
                    <p className="text-green-300 text-xs mt-0.5">{businessEmail}</p>
                    <p className="text-slate-400 text-xs mt-1">Your gym will go live instantly.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {verificationMethod === 'instagram' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 border border-purple-400/20 rounded-2xl flex items-start gap-3">
                <Instagram className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Instagram DM Verification</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Send us a DM from your gym's Instagram with your unique code. We'll verify within 24 hours.
                  </p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-slate-400 text-xs mb-2">Your unique verification code</p>
                <p className="text-2xl font-black text-white tracking-widest mb-2">{instagramCode}</p>
                <p className="text-slate-500 text-xs">DM this to <span className="text-purple-400 font-semibold">@CoStrideApp</span> from your gym's account</p>
              </div>
              <div>
                <Label className="text-white font-semibold text-sm mb-2 block">Your Gym's Instagram Handle</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="yourgymhandle"
                    className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-12 pl-8" />
                </div>
              </div>
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">Once we receive your DM we'll approve your gym within 24 hours.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)}
              className="flex-1 h-12 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-semibold text-sm transition-all">
              Back
            </button>
            <button onClick={() => setStep(4)}
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2">
              {emailVerified ? 'Continue ✓' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setStep(4)}
            className="w-full mt-3 text-slate-500 text-xs hover:text-slate-300 transition-colors">
            Skip verification — gym goes live within 24hrs →
          </button>
        </div>
      </PageWrapper>
    );
  }

  // ─── STEP 4: Gym Profile ──────────────────────────────────────────────────
  if (step === 4) {
    return (
      <PageWrapper>
        <StepHeader step="Step 3 of 4" title="Set Up Your Gym"
          subtitle="Tell members what makes your gym great" />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">

          {/* Description */}
          <div>
            <Label className="text-white font-semibold text-sm mb-2 block">Gym Description</Label>
            <textarea value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell members what makes your gym unique..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 text-sm p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400/50" />
          </div>

          {/* Specializations */}
          <div>
            <Label className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" /> Specializations
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATION_OPTIONS.map((spec) => (
                <button key={spec} type="button" onClick={() => toggleArrayItem('specializes_in', spec)}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-all border ${
                    formData.specializes_in.includes(spec)
                      ? 'bg-purple-500/30 border-purple-400/60 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}>
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment with search */}
          <div>
            <Label className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-400" /> Equipment
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </Label>

            {/* Search input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && equipmentSearch.trim()) {
                    e.preventDefault();
                    addEquipment(equipmentSearch.trim());
                  }
                }}
                placeholder="Search or type custom equipment..."
                className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 pl-9 h-10 text-sm"
              />

              {/* Suggestions dropdown */}
              {equipmentSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {equipmentSuggestions.map((item, idx) => {
                    const isCustom = item.startsWith('__custom__');
                    const label = isCustom ? item.replace('__custom__', '') : item;
                    return (
                      <button key={idx} type="button" onClick={() => addEquipment(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-center gap-2">
                        {isCustom
                          ? <><Plus className="w-3 h-3 text-blue-400 flex-shrink-0" /><span className="text-blue-300 text-sm">Add "<span className="font-semibold">{label}</span>"</span></>
                          : <><Dumbbell className="w-3 h-3 text-slate-400 flex-shrink-0" /><span className="text-white text-sm">{label}</span></>
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected equipment tags */}
            {formData.equipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.equipment.map((item) => (
                  <div key={item}
                    className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-xl">
                    {item}
                    <button onClick={() => removeEquipment(item)}
                      className="text-blue-300 hover:text-white transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.equipment.length === 0 && (
              <p className="text-slate-500 text-xs">No equipment added yet — search above to add</p>
            )}
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-400" /> Amenities
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button key={amenity} type="button" onClick={() => toggleArrayItem('amenities', amenity)}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-all border ${
                    formData.amenities.includes(amenity)
                      ? 'bg-green-500/30 border-green-400/60 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}>
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setStep(3)}
              className="flex-1 h-12 rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 font-semibold text-sm transition-all">
              Back
            </button>
            <button onClick={submitGym} disabled={createGymMutation.isPending}
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {createGymMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                : <>Complete <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <button onClick={submitGym} disabled={createGymMutation.isPending}
            className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors disabled:opacity-50">
            Skip for now →
          </button>
        </div>
      </PageWrapper>
    );
  }

  // ─── STEP 7: QR Code / Ready ──────────────────────────────────────────────
  if (step === 7) {
    return (
      <PageWrapper>
        <div className="text-center">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-3xl flex items-center justify-center border border-green-400/30">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-black text-white">You're Ready!</h1>
            <p className="text-slate-400 text-sm">
              <span className="text-white font-semibold">{createdGym?.name}</span> is live on CoStride
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-4">
            <p className="text-slate-300 text-sm mb-4">Display this QR code so members can join your community instantly</p>
            <div className="flex justify-center mb-4">
              <div className="bg-blue-900 p-4 rounded-2xl border border-blue-400/20 shadow-xl">
                <div id="qr-container" className="w-[180px] h-[180px]" />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-5">
              <p className="text-slate-400 text-xs mb-1">Join Code</p>
              <p className="text-2xl font-black text-white tracking-widest">{createdGym?.join_code}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button className="p-3 bg-purple-500/15 border border-purple-400/30 rounded-2xl text-left hover:bg-purple-500/20 transition-all group">
                <Trophy className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white text-xs font-bold">Create Challenge</p>
                <p className="text-slate-400 text-xs">Motivate members</p>
              </button>
              <button className="p-3 bg-blue-500/15 border border-blue-400/30 rounded-2xl text-left hover:bg-blue-500/20 transition-all group">
                <Bell className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white text-xs font-bold">Create Poll</p>
                <p className="text-slate-400 text-xs">Get member feedback</p>
              </button>
            </div>
            <button onClick={() => navigate(createPageUrl('GymOwnerDashboard'))}
              className="w-full h-14 rounded-2xl font-bold text-base text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-slate-500 text-xs">We'll email you a printable poster with your QR code shortly</p>
        </div>
      </PageWrapper>
    );
  }
}