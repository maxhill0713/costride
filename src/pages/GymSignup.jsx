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
  Bell, Mail, Instagram, Shield, Sparkles, Plus, X, Clock
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
  { value: 'general', label: 'General Fitness', emoji: '🏋️' },
  { value: 'powerlifting', label: 'Powerlifting', emoji: '🔱' },
  { value: 'bodybuilding', label: 'Bodybuilding', emoji: '💪' },
  { value: 'crossfit', label: 'CrossFit', emoji: '⚡' },
  { value: 'boxing', label: 'Boxing', emoji: '🥊' },
  { value: 'mma', label: 'MMA', emoji: '🥋' }
];

function StepHeader({ step, total = 4, title, subtitle }) {
  return (
    <div className="text-center mb-8 flex flex-col items-center gap-3">
      <img
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
        alt="CoStride"
        className="w-14 h-14 rounded-2xl object-cover shadow-xl border border-white/20"
      />
      {/* Step progress dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i + 1 === step ? 'w-6 h-2 bg-blue-400' :
            i + 1 < step ? 'w-2 h-2 bg-blue-600' :
            'w-2 h-2 bg-white/20'
          }`} />
        ))}
      </div>
      <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Step {step} of {total}</span>
      </div>
      <h1 className="text-3xl font-black text-white">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm text-center max-w-xs">{subtitle}</p>}
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center py-8 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md w-full relative z-10">{children}</div>
    </div>
  );
}

function SectionLabel({ icon: Icon, color, label, note }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-white font-bold text-sm">{label}</span>
      {note && <span className="text-slate-500 text-xs">{note}</span>}
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

  useEffect(() => {
    if (!equipmentSearch.trim()) { setEquipmentSuggestions([]); return; }
    const query = equipmentSearch.toLowerCase();
    const filtered = PRESET_EQUIPMENT.filter(e =>
      e.toLowerCase().includes(query) && !formData.equipment.includes(e)
    );
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
          width: 200, height: 200,
          colorDark: '#ffffff', colorLight: '#0f2040',
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
      await base44.auth.updateMe({ account_type: 'gym_owner', onboarding_completed: true });
      const gymLanguage = detectLanguageFromCity(data.city);
      const isVerified = emailVerified;
      const gymStatus = isVerified ? 'approved' : 'pending';

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));

      let gym;
      if (data.claimingGymId) {
        gym = await base44.asServiceRole.entities.Gym.update(data.claimingGymId, {
          name: data.name, type: data.type, language: gymLanguage,
          owner_email: user.email, admin_id: user.id,
          amenities: data.amenities, equipment: data.equipment,
          specializes_in: data.specializes_in, description: data.description,
          claim_status: 'claimed', status: gymStatus, verified: isVerified
        });
      } else {
        gym = await base44.entities.Gym.create({
          name: data.name, google_place_id: data.google_place_id || '',
          latitude: data.latitude, longitude: data.longitude,
          address: data.address || '', city: data.city || '', postcode: data.postcode || '',
          type: data.type || 'general', language: gymLanguage,
          description: data.description || '',
          amenities: data.amenities || [], equipment: data.equipment || [],
          specializes_in: data.specializes_in || [],
          owner_email: user.email, join_code: joinCode,
          verified: isVerified, admin_id: user.id,
          claim_status: 'claimed', status: gymStatus
        });
      }

      await base44.entities.GymMembership.create({
        user_id: user.id, user_name: user.full_name, user_email: user.email,
        gym_id: gym.id, gym_name: gym.name, status: 'active',
        join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime'
      });

      return gym;
    },
    onSuccess: (gym) => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      if (gym.status === 'pending') {
        toast.success("Gym submitted! We'll review it within 24 hours.");
      } else {
        toast.success('Gym registered and live!');
      }
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
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item]
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
          <button onClick={() => setStep(2)} className="text-slate-400 text-sm font-semibold hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5">
            Skip →
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 text-center max-w-sm px-4">
          <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-8 shadow-2xl transition-all duration-500`}
            style={{ boxShadow: '0 20px 60px rgba(59,130,246,0.3)' }}>
            <SlideIcon className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">{slide.title}</h2>
          <p className="text-slate-300 text-base leading-relaxed">{slide.description}</p>
        </div>
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5">
          <div className="flex gap-2">
            {PREVIEW_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all duration-300 ${i === slideIndex ? 'w-8 h-2 bg-blue-400' : 'w-2 h-2 bg-white/25 hover:bg-white/40'}`} />
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
        <StepHeader step={2} title="Select Your Gym"
          subtitle="Search for your gym — we'll check if a community already exists" />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/8 rounded-3xl p-6 shadow-2xl">

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); searchGooglePlaces(e.target.value); }}
              placeholder="Search gym name or location..."
              className="rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 pl-10 h-12 focus:border-blue-400/50" />
            {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
          </div>

          {searchResults.length > 0 && (
            <div className="bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto mb-3">
              {searchResults.slice(0, 8).map((place, idx) => (
                <button key={idx} type="button" onClick={() => handleSelectPlace(place)}
                  className="w-full text-left px-4 py-3 hover:bg-white/8 transition-colors border-b border-white/5 last:border-0 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white text-sm truncate">{place.name}</div>
                    <div className="text-xs text-slate-400 truncate">{place.address}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {selectedPlace ? (
            <div className="mb-5 p-4 bg-blue-500/10 border border-blue-400/25 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white text-sm truncate">{selectedPlace.name}</div>
                <div className="text-xs text-slate-400 truncate">{selectedPlace.address}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-xs font-semibold">Selected</span>
              </div>
            </div>
          ) : (
            <div className="mb-5 h-[62px]" />
          )}

          {/* Gym Type */}
          <div className="mb-6">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Gym Type</p>
            <div className="grid grid-cols-3 gap-2">
              {GYM_TYPES.map((type) => (
                <button key={type.value} type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center gap-1.5 ${
                    formData.type === type.value
                      ? 'bg-blue-500/20 border-blue-400/50 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white hover:border-white/15'
                  }`}>
                  <span className="text-base">{type.emoji}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => selectedPlace && setStep(3)} disabled={!selectedPlace}
            className={`w-full h-14 rounded-2xl font-bold text-base transition-all duration-100 flex items-center justify-center gap-2 border-b-[5px] ${
              selectedPlace
                ? 'bg-blue-500 border-blue-700 text-white hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2'
                : 'bg-slate-800 border-slate-900 text-slate-600 cursor-not-allowed'
            }`}>
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Ghost Gym Modal */}
        {showGhostGymModal && ghostGym && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 border border-amber-400/20">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Community Already Exists!</h3>
              <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                Members have already built a community for <span className="font-bold text-white">{ghostGym.name}</span> with{' '}
                <span className="font-bold text-amber-400">{ghostGym.members_count || 0} members</span>. Claim it to take ownership.
              </p>
              <div className="bg-white/5 border border-white/8 rounded-2xl p-4 mb-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-400/20">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{ghostGym.name}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
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
        <StepHeader step={3} title="Verify Ownership"
          subtitle={`Prove you own ${formData.name}`} />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/8 rounded-3xl p-6 shadow-2xl">

          {/* Method toggle */}
          <div className="flex gap-2 p-1 bg-black/20 rounded-2xl mb-6 border border-white/5">
            <button onClick={() => { setVerificationMethod('email'); setCodeSent(false); setEmailVerified(false); setEnteredCode(''); }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                verificationMethod === 'email'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              <Mail className="w-4 h-4" /> Business Email
            </button>
            <button onClick={() => setVerificationMethod('instagram')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                verificationMethod === 'instagram'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              <Instagram className="w-4 h-4" /> Instagram
            </button>
          </div>

          {/* Email verification */}
          {verificationMethod === 'email' && (
            <div className="space-y-4">
              {!emailVerified ? (
                <>
                  <div className="p-4 bg-blue-500/8 border border-blue-400/15 rounded-2xl flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">How it works</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Enter your business email. We'll send a 6-digit code — if you can receive it, you own it. Gmail/personal emails go to manual review.
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2 block">Business Email</Label>
                    <div className="flex gap-2">
                      <Input type="email" value={businessEmail}
                        onChange={(e) => { setBusinessEmail(e.target.value); setCodeSent(false); setEnteredCode(''); }}
                        placeholder="owner@yourgym.com" disabled={codeSent}
                        className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-12 flex-1 disabled:opacity-50 focus:border-blue-400/50" />
                      <button onClick={handleSendCode} disabled={!businessEmail || sendingCode || codeSent}
                        className="h-12 px-4 rounded-xl bg-blue-500 border-b-[3px] border-blue-700 text-white font-bold text-sm hover:bg-blue-400 active:translate-y-0.5 active:border-b transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
                        {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : codeSent ? '✓ Sent' : 'Send Code'}
                      </button>
                    </div>
                  </div>

                  {codeSent && (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-500/8 border border-green-500/20 rounded-xl flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-300">Code sent to <span className="font-bold">{businessEmail}</span></p>
                      </div>
                      <div>
                        <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2 block">6-Digit Code</Label>
                        <div className="flex gap-2">
                          <Input value={enteredCode}
                            onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000" maxLength={6}
                            className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 h-12 flex-1 text-center text-2xl font-black tracking-widest focus:border-blue-400/50" />
                          <button onClick={handleVerifyCode} disabled={enteredCode.length !== 6 || verifyingCode}
                            className="h-12 px-5 rounded-xl bg-green-500 border-b-[3px] border-green-700 text-white font-bold text-sm hover:bg-green-400 active:translate-y-0.5 active:border-b transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                            {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => { setCodeSent(false); setEnteredCode(''); }}
                        className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
                        ← Wrong email? Change it
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-5 bg-green-500/8 border border-green-500/20 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-green-400/20">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Email Verified!</p>
                    <p className="text-green-400 text-xs mt-0.5 font-medium">{businessEmail}</p>
                    <p className="text-slate-400 text-xs mt-1">Your gym will go live instantly after setup.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instagram verification */}
          {verificationMethod === 'instagram' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/8 border border-purple-400/15 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Instagram className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">Instagram DM Verification</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Send a DM from your gym's Instagram with your unique code below. We'll verify within 24 hours.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-2xl p-5 text-center">
                <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider font-semibold">Your Unique Code</p>
                <p className="text-3xl font-black text-white tracking-widest mb-3">{instagramCode}</p>
                <p className="text-slate-400 text-xs">DM this to <span className="text-purple-400 font-bold">@CoStrideApp</span> from your gym's account</p>
              </div>

              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2 block">Your Gym's Instagram</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="yourgymhandle"
                    className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 h-12 pl-8 focus:border-purple-400/50" />
                </div>
              </div>

              <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-200">We'll approve your gym within 24 hours of receiving your DM.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(2)}
              className="flex-1 h-12 rounded-2xl border border-white/10 bg-white/4 text-slate-300 hover:bg-white/8 font-semibold text-sm transition-all">
              Back
            </button>
            <button onClick={() => setStep(4)}
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2">
              {emailVerified ? <>Continue ✓ <ArrowRight className="w-4 h-4" /></> : <>Continue <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <button onClick={() => setStep(4)}
            className="w-full mt-3 text-slate-500 text-xs hover:text-slate-300 transition-colors py-2">
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
        <StepHeader step={4} title="Set Up Your Gym"
          subtitle="Tell members what makes your gym great" />

        <div className="bg-white/5 backdrop-blur-2xl border border-white/8 rounded-3xl p-6 shadow-2xl space-y-6">

          {/* Description */}
          <div>
            <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider mb-2 block">Gym Description</Label>
            <textarea value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell members what makes your gym unique..."
              rows={3}
              className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400/40 focus:border-blue-400/40 leading-relaxed" />
          </div>

          {/* Divider */}
          <div className="border-t border-white/6" />

          {/* Specializations */}
          <div>
            <SectionLabel icon={Star} color="from-purple-400 to-pink-500" label="Specializations" note="(optional)" />
            <div className="grid grid-cols-2 gap-2">
              {SPECIALIZATION_OPTIONS.map((spec) => (
                <button key={spec} type="button" onClick={() => toggleArrayItem('specializes_in', spec)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-left ${
                    formData.specializes_in.includes(spec)
                      ? 'bg-purple-500/20 border-purple-400/50 text-purple-200'
                      : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white hover:border-white/15'
                  }`}>
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/6" />

          {/* Equipment */}
          <div>
            <SectionLabel icon={Dumbbell} color="from-blue-400 to-cyan-500" label="Equipment" note="(optional)" />
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
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
                className="rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-600 pl-9 h-10 text-sm focus:border-blue-400/40"
              />
              {equipmentSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-slate-900/99 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-44 overflow-y-auto">
                  {equipmentSuggestions.map((item, idx) => {
                    const isCustom = item.startsWith('__custom__');
                    const label = isCustom ? item.replace('__custom__', '') : item;
                    return (
                      <button key={idx} type="button" onClick={() => addEquipment(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/8 transition-colors border-b border-white/5 last:border-0 flex items-center gap-2.5">
                        {isCustom
                          ? <><Plus className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /><span className="text-blue-300 text-sm">Add "<span className="font-bold">{label}</span>"</span></>
                          : <><Dumbbell className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /><span className="text-white text-sm">{label}</span></>
                        }
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {formData.equipment.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.equipment.map((item) => (
                  <div key={item}
                    className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-400/25 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-xl">
                    {item}
                    <button onClick={() => removeEquipment(item)} className="text-blue-400 hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs">No equipment added yet</p>
            )}
          </div>

          <div className="border-t border-white/6" />

          {/* Amenities */}
          <div>
            <SectionLabel icon={Building2} color="from-green-400 to-emerald-500" label="Amenities" note="(optional)" />
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <button key={amenity} type="button" onClick={() => toggleArrayItem('amenities', amenity)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-left ${
                    formData.amenities.includes(amenity)
                      ? 'bg-green-500/20 border-green-400/50 text-green-200'
                      : 'bg-white/4 border-white/8 text-slate-400 hover:bg-white/8 hover:text-white hover:border-white/15'
                  }`}>
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(3)}
              className="flex-1 h-12 rounded-2xl border border-white/10 bg-white/4 text-slate-300 hover:bg-white/8 font-semibold text-sm transition-all">
              Back
            </button>
            <button onClick={submitGym} disabled={createGymMutation.isPending}
              className="flex-1 h-12 rounded-2xl font-bold text-sm text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {createGymMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                : <>Complete Setup <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

          <button onClick={submitGym} disabled={createGymMutation.isPending}
            className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors py-1 disabled:opacity-40">
            Skip for now →
          </button>
        </div>
      </PageWrapper>
    );
  }

  // ─── STEP 7: Complete ─────────────────────────────────────────────────────
  if (step === 7) {
    const isPending = createdGym?.status === 'pending';
    return (
      <PageWrapper>
        <div className="text-center">

          {/* Status header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-2xl ${
              isPending
                ? 'bg-amber-500/15 border-amber-400/30 shadow-amber-500/10'
                : 'bg-green-500/15 border-green-400/30 shadow-green-500/10'
            }`}>
              {isPending
                ? <Clock className="w-10 h-10 text-amber-400" />
                : <CheckCircle2 className="w-10 h-10 text-green-400" />
              }
            </div>
            <h1 className="text-4xl font-black text-white">
              {isPending ? 'Under Review!' : "You're Live!"}
            </h1>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              {isPending
                ? <><span className="text-amber-400 font-semibold">Pending approval</span> — we'll review <span className="text-white font-semibold">{createdGym?.name}</span> within 24 hours</>
                : <><span className="text-white font-semibold">{createdGym?.name}</span> is live on CoStride</>
              }
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/8 rounded-3xl p-6 shadow-2xl mb-4 text-left">

            {/* Pending notice */}
            {isPending && (
              <div className="p-4 bg-amber-500/8 border border-amber-400/15 rounded-2xl mb-6 flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-300 font-bold text-sm mb-1">What happens next?</p>
                  <p className="text-amber-200/70 text-xs leading-relaxed">Our team will verify your gym ownership within 24 hours. You'll receive an email once approved. Your QR code is ready to share in the meantime.</p>
                </div>
              </div>
            )}

            {/* QR Code */}
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-center mb-4">Share to let members join</p>
            <div className="flex justify-center mb-5">
              <div className="bg-[#0f2040] p-5 rounded-3xl border border-blue-400/15 shadow-2xl">
                <div id="qr-container" className="w-[200px] h-[200px]" />
              </div>
            </div>

            {/* Join code */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-4 mb-5 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Join Code</p>
              <p className="text-3xl font-black text-white tracking-[0.3em]">{createdGym?.join_code}</p>
            </div>

            {/* Quick actions */}
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="p-4 bg-purple-500/10 border border-purple-400/20 rounded-2xl text-left hover:bg-purple-500/15 transition-all group">
                <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Trophy className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-white text-sm font-bold">Create Challenge</p>
                <p className="text-slate-500 text-xs mt-0.5">Motivate members</p>
              </button>
              <button className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-2xl text-left hover:bg-blue-500/15 transition-all group">
                <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-white text-sm font-bold">Create Poll</p>
                <p className="text-slate-500 text-xs mt-0.5">Get feedback</p>
              </button>
            </div>

            <button onClick={() => navigate(createPageUrl('GymOwnerDashboard'))}
              className="w-full h-14 rounded-2xl font-bold text-base text-white bg-blue-500 border-b-[5px] border-blue-700 hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 transition-all duration-100 flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-slate-600 text-xs">We'll email you a printable poster with your QR code shortly</p>
        </div>
      </PageWrapper>
    );
  }
}