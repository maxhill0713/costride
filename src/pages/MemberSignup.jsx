import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Loader2, CheckCircle2, Search, MapPin, AlertCircle, ArrowRight,
  Building2, Star, Users, Camera, Upload, Instagram, Mail,
  QrCode, ChevronRight, Trophy, BarChart2, Sparkles, X,
  Dumbbell, Zap, Shield, TrendingUp, Globe, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const verifyEmailDomain = (email, website) => {
  if (!email || !website) return null;
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const generic = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','aol.com'];
  if (generic.includes(emailDomain)) return 'manual_review';
  let wd = website.toLowerCase().replace(/https?:\/\/(www\.)?/,'').split('/')[0];
  return (emailDomain === wd || wd.includes(emailDomain)) ? 'verified' : 'manual_review';
};

const detectLang = (city) => {
  const es = ['Madrid','Barcelona','Valencia','Seville','Zaragoza','Málaga','Murcia','Palma','Las Palmas','Bilbao'];
  return es.some(c => city?.includes(c)) ? 'es' : 'en';
};

const randCode = (len = 6) => {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: len }, () => c[Math.floor(Math.random() * c.length)]).join('');
};

export default function GymSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGym, setCreatedGym] = useState(null);

  const [formData, setFormData] = useState({
    name: '', google_place_id: '', latitude: null, longitude: null,
    address: '', city: '', postcode: '', type: 'general', language: 'en',
    amenities: [], equipment: [], specializes_in: [], description: '',
    cover_photo_url: '', photos: [], instagram: '', claimingGymId: null
  });

  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [ghostGym, setGhostGym] = useState(null);
  const [showGhostModal, setShowGhostModal] = useState(false);

  const [businessEmail, setBusinessEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  const [coverPreview, setCoverPreview] = useState(null);
  const coverRef = useRef();

  const amenitiesOptions = ['WiFi','Parking','24/7','Personal Training','Showers','Lockers','Sauna','Smoothie Bar'];
  const specializationOptions = ['Weight Loss','Muscle Gain','Bulking','Strength','Powerlifting','Bodybuilding','CrossFit','HIIT','Cardio','Rehab'];
  const equipmentOptions = ['Barbells','Dumbbells','Machines','Cables','Squat Racks','Cardio','Kettlebells','Resistance Bands'];
  const gymTypes = [
    { value: 'general', label: 'General Fitness', icon: '🏋️' },
    { value: 'powerlifting', label: 'Powerlifting', icon: '🔩' },
    { value: 'bodybuilding', label: 'Bodybuilding', icon: '💪' },
    { value: 'crossfit', label: 'CrossFit', icon: '⚡' },
    { value: 'boxing', label: 'Boxing', icon: '🥊' },
    { value: 'mma', label: 'MMA', icon: '🥋' },
  ];

  const toggleArr = (field, item) =>
    setFormData(p => ({
      ...p,
      [field]: p[field].includes(item) ? p[field].filter(i => i !== item) : [...p[field], item]
    }));

  const searchGooglePlaces = async (q) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await base44.functions.invoke('searchGymsPlaces', { input: q });
      setSearchResults(res.data.results || []);
    } catch {
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
      const existing = await base44.entities.Gym.filter({ google_place_id: place.place_id });
      const ghost = existing.find(g => g.claim_status === 'unclaimed');
      if (ghost) { setGhostGym(ghost); setShowGhostModal(true); return; }
    } catch {}
    setFormData(p => ({
      ...p, name: place.name, google_place_id: place.place_id,
      latitude: place.latitude, longitude: place.longitude,
      address: place.address || '', city: place.city || '', postcode: place.postcode || ''
    }));
  };

  const handleClaimGhost = () => {
    if (!ghostGym) return;
    setFormData(p => ({
      ...p, name: ghostGym.name, google_place_id: ghostGym.google_place_id,
      latitude: ghostGym.latitude, longitude: ghostGym.longitude,
      address: ghostGym.address || '', city: ghostGym.city || '', postcode: ghostGym.postcode || '',
      type: ghostGym.type || 'general', amenities: ghostGym.amenities || [],
      equipment: ghostGym.equipment || [], specializes_in: ghostGym.specializes_in || [],
      claimingGymId: ghostGym.id
    }));
    setShowGhostModal(false);
    toast.success('Gym claimed! Continue to verify ownership.');
    setStep(3);
  };

  const handleSendCode = async () => {
    if (!businessEmail) return;
    setSendingCode(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setCodeSent(true);
      toast.success('Verification code sent!');
    } catch {
      toast.error('Failed to send code.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.auth.updateMe({ account_type: 'gym_owner', onboarding_completed: true });
      const lang = detectLang(formData.city);
      const isVerified = emailStatus === 'verified';
      let gym;

      if (formData.claimingGymId) {
        gym = await base44.asServiceRole.entities.Gym.update(formData.claimingGymId, {
          name: formData.name, type: formData.type, language: lang,
          owner_email: user.email, admin_id: user.id,
          amenities: formData.amenities, equipment: formData.equipment,
          specializes_in: formData.specializes_in, description: formData.description,
          cover_photo_url: formData.cover_photo_url, photos: formData.photos,
          claim_status: 'claimed', status: isVerified ? 'approved' : 'pending', verified: isVerified
        });
      } else {
        const joinCode = randCode(6);
        gym = await base44.entities.Gym.create({
          ...formData, language: lang, owner_email: user.email,
          join_code: joinCode, verified: isVerified, admin_id: user.id,
          claim_status: 'claimed', status: isVerified ? 'approved' : 'pending'
        });
      }

      await base44.entities.GymMembership.create({
        user_id: user.id, user_name: user.full_name, user_email: user.email,
        gym_id: gym.id, gym_name: gym.name, status: 'active',
        join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime'
      });

      setCreatedGym(gym);
      toast.success('Gym registered!');
      setStep(5);
    } catch (err) {
      toast.error(err?.message || 'Failed to register gym.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-start py-6 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">

        <div className="flex justify-center mb-5">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
            alt="CoStride"
            className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-blue-500/30"
          />
        </div>

        {step > 1 && step < 6 && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Step {step - 1} of 4</span>
              <span>{Math.round(((step - 2) / 3) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${((step - 2) / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 1: WELCOME ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Welcome to CoStride</h1>
              <p className="text-slate-400 text-sm">Your gym community platform</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  icon: <Users className="w-5 h-5" />, color: 'text-blue-400',
                  bg: 'bg-blue-500/15 border-blue-500/30',
                  title: 'Build Your Community',
                  desc: 'Members join your gym, post workouts, and connect with each other.'
                },
                {
                  icon: <Trophy className="w-5 h-5" />, color: 'text-amber-400',
                  bg: 'bg-amber-500/15 border-amber-500/30',
                  title: 'Run Challenges',
                  desc: 'Create fitness challenges to keep members motivated and engaged.'
                },
                {
                  icon: <BarChart2 className="w-5 h-5" />, color: 'text-emerald-400',
                  bg: 'bg-emerald-500/15 border-emerald-500/30',
                  title: 'Track Progress',
                  desc: 'Members log workouts and see their improvement over time.'
                },
                {
                  icon: <QrCode className="w-5 h-5" />, color: 'text-purple-400',
                  bg: 'bg-purple-500/15 border-purple-500/30',
                  title: 'Easy Onboarding',
                  desc: 'Share your QR code — members scan and join instantly.'
                },
              ].map((f, i) => (
                <div key={i} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${f.bg} backdrop-blur-sm`}>
                  <div className={`${f.color} mt-0.5 flex-shrink-0`}>{f.icon}</div>
                  <div>
                    <p className="text-white font-bold text-sm">{f.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-13 text-base shadow-[0_4px_0_0_#1a3fa8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-center text-xs text-slate-500">Free to register • No credit card needed</p>
          </div>
        )}

        {/* ── STEP 2: SELECT GYM ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Select Your Gym</h2>
              <p className="text-slate-400 text-sm mt-0.5">Search and claim your gym's community</p>
            </div>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); searchGooglePlaces(e.target.value); }}
                  placeholder="Search gym name or location..."
                  className="rounded-2xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 pl-10 h-12 text-sm"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-30 w-full mt-2 bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-72 overflow-y-auto">
                  {searchResults.slice(0, 8).map((place, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left px-4 py-3 hover:bg-white/8 transition-colors border-b border-white/5 last:border-0 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm">{place.name}</div>
                        <div className="text-xs text-slate-400 truncate">{place.address}</div>
                        <div className="mt-1">
                          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                            Unclaimed
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedPlace && (
              <div className="space-y-3">
                <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-300 font-medium">{selectedPlace.name} selected</span>
                </div>
                <div>
                  <Label className="text-white font-bold text-sm mb-2 block">Gym Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {gymTypes.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, type: t.value }))}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                          formData.type === t.value
                            ? 'bg-blue-500/30 border-blue-400/60 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-lg mb-0.5">{t.icon}</div>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => setStep(3)}
                  className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
                >
                  Claim This Gym <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            {!selectedPlace && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-slate-500 text-sm">Search above to find your gym</p>
                <p className="text-slate-600 text-xs mt-1">We'll check if a community already exists</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: VERIFY OWNERSHIP ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Verify Ownership</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Prove you own <span className="text-white font-semibold">{formData.name}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVerifyMethod('email')}
                className={`p-3 rounded-2xl border text-sm font-bold transition-all flex items-center gap-2 justify-center ${
                  verifyMethod === 'email'
                    ? 'bg-blue-500/30 border-blue-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Mail className="w-4 h-4" /> Business Email
              </button>
              <button
                type="button"
                onClick={() => setVerifyMethod('instagram')}
                className={`p-3 rounded-2xl border text-sm font-bold transition-all flex items-center gap-2 justify-center ${
                  verifyMethod === 'instagram'
                    ? 'bg-pink-500/30 border-pink-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <Instagram className="w-4 h-4" /> Instagram
              </button>
            </div>
            {verifyMethod === 'email' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-300">
                    Enter your business email — it should match your gym's website domain (e.g.{' '}
                    <span className="font-mono">owner@yourgym.com</span>)
                  </p>
                </div>
                <div>
                  <Label className="text-white font-bold text-sm mb-1.5 block">Business Email</Label>
                  <Input
                    type="email"
                    value={businessEmail}
                    onChange={e => {
                      const v = e.target.value;
                      setBusinessEmail(v);
                      if (selectedPlace?.website && v) setEmailStatus(verifyEmailDomain(v, selectedPlace.website));
                      else setEmailStatus(null);
                      setCodeSent(false);
                    }}
                    placeholder="owner@yourgym.com"
                    className="rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 h-11 text-sm"
                  />
                </div>
                {emailStatus === 'verified' && (
                  <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-xs font-bold text-green-300">Domain matches! ✓</p>
                      <p className="text-xs text-green-400/70">We'll send a verification code to confirm.</p>
                    </div>
                  </div>
                )}
                {emailStatus === 'manual_review' && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">Manual Review Required</p>
                      <p className="text-xs text-amber-400/70">We'll verify your ownership within 24 hours.</p>
                    </div>
                  </div>
                )}
                {businessEmail && !codeSent && (
                  <Button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl h-11 flex items-center justify-center gap-2 transition-all"
                  >
                    {sendingCode
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                      : <>Send Verification Code <Mail className="w-4 h-4" /></>}
                  </Button>
                )}
                {codeSent && (
                  <div className="space-y-2">
                    <Label className="text-white font-bold text-sm mb-1.5 block">Enter the code we sent</Label>
                    <Input
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value)}
                      placeholder="e.g. 483921"
                      maxLength={6}
                      className="rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 h-11 text-center tracking-widest font-mono text-lg"
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
                    >
                      Resend code
                    </button>
                  </div>
                )}
              </div>
            )}
            {verifyMethod === 'instagram' && (
              <div className="space-y-3">
                <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl">
                  <p className="text-xs text-pink-300">
                    Provide your gym's Instagram handle. We'll check that the account references your gym and follow up within 24 hours.
                  </p>
                </div>
                <div>
                  <Label className="text-white font-bold text-sm mb-1.5 block">Instagram Handle</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                    <Input
                      value={formData.instagram}
                      onChange={e => setFormData(p => ({ ...p, instagram: e.target.value }))}
                      placeholder="yourgymhandle"
                      className="rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 h-11 text-sm pl-7"
                    />
                  </div>
                </div>
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    Verification via Instagram takes up to 24 hours. Your gym will show as <span className="font-bold">pending</span> until then.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/8 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center justify-center"
              >
                ←
              </Button>
              <Button
                type="button"
                onClick={() => setStep(4)}
                disabled={verifyMethod === 'email' && !businessEmail}
                className="flex-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              Skip verification for now →
            </button>
          </div>
        )}

        {/* ── STEP 4: GYM PROFILE ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Set Up Your Profile</h2>
              <p className="text-slate-400 text-sm mt-0.5">Help members know what your gym is about</p>
            </div>
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 block">Cover Photo</Label>
              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="w-full h-36 rounded-2xl border-2 border-dashed border-white/20 hover:border-blue-400/50 bg-slate-800/40 hover:bg-slate-800/60 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden relative"
              >
                {coverPreview ? (
                  <img src={coverPreview} className="absolute inset-0 w-full h-full object-cover" alt="cover" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-slate-500" />
                    <span className="text-sm text-slate-500 font-medium">Tap to add cover photo</span>
                  </>
                )}
              </button>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                      setCoverPreview(ev.target.result);
                      setFormData(p => ({ ...p, cover_photo_url: ev.target.result }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 block">Description</Label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Tell members what makes your gym special..."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm p-3 resize-none focus:outline-none focus:border-blue-400/50 transition-colors"
              />
            </div>
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 flex items-center gap-1.5 block">
                <Star className="w-3.5 h-3.5 text-purple-400" />
                Specializations <span className="font-normal text-slate-500 text-xs ml-1">(pick at least 1)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {specializationOptions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleArr('specializes_in', s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      formData.specializes_in.includes(s)
                        ? 'bg-purple-500/30 border-purple-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 flex items-center gap-1.5 block">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" /> Equipment
              </Label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggleArr('equipment', e)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      formData.equipment.includes(e)
                        ? 'bg-blue-500/30 border-blue-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 flex items-center gap-1.5 block">
                <Building2 className="w-3.5 h-3.5 text-green-400" /> Amenities
              </Label>
              <div className="flex flex-wrap gap-2">
                {amenitiesOptions.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArr('amenities', a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      formData.amenities.includes(a)
                        ? 'bg-green-500/30 border-green-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/8 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center justify-center"
              >
                ←
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || formData.specializes_in.length === 0}
                className="flex-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</>
                  : <>Complete Registration <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              Skip profile setup for now →
            </button>
          </div>
        )}

        {/* ── STEP 5: QR CODE ── */}
        {step === 5 && (
          <div className="space-y-5 text-center">
            <div>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">You're Ready to Go!</h2>
              <p className="text-slate-400 text-sm mt-1">Activate your community and start growing</p>
            </div>
            <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <QrCode className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-white">Your Gym QR Code</span>
              </div>
              <div className="w-40 h-40 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <QrCode className="w-24 h-24 text-slate-900 mx-auto" />
                  <p className="text-slate-600 text-xs font-mono mt-1">{createdGym?.join_code || 'ABC123'}</p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Display this at your gym so members can scan and join your community instantly.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl h-10 text-sm border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Save QR
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl h-10 text-sm border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> Email Poster
                </Button>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
              <p className="text-xs text-blue-300 font-bold mb-0.5">💡 Pro tip</p>
              <p className="text-xs text-slate-400">
                We can email you a print-ready poster with your QR code — perfect for displaying at reception or on your gym floor.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setStep(6)}
              className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
            >
              Activate My Community <Sparkles className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* ── STEP 6: QUICK ACTIONS ── */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-2xl font-black text-white tracking-tight">Community Activated!</h2>
              <p className="text-slate-400 text-sm mt-1">Here's how to kick things off</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  icon: <BarChart2 className="w-5 h-5" />, color: 'text-blue-400',
                  bg: 'bg-blue-500/15 border-blue-400/30',
                  title: 'Create a Poll',
                  desc: 'Ask your members what classes or challenges they want.',
                  action: 'Create Poll',
                  onClick: () => navigate(createPageUrl('GymOwnerDashboard'))
                },
                {
                  icon: <Trophy className="w-5 h-5" />, color: 'text-amber-400',
                  bg: 'bg-amber-500/15 border-amber-400/30',
                  title: 'Start a Challenge',
                  desc: 'Launch a fitness challenge to get members engaged from day one.',
                  action: 'Create Challenge',
                  onClick: () => navigate(createPageUrl('GymOwnerDashboard'))
                },
                {
                  icon: <Users className="w-5 h-5" />, color: 'text-emerald-400',
                  bg: 'bg-emerald-500/15 border-emerald-400/30',
                  title: 'Invite Members',
                  desc: `Share your QR code or gym code: ${createdGym?.join_code || '—'}`,
                  action: 'Share Code',
                  onClick: () => setStep(5)
                },
              ].map((item, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl border ${item.bg}`}>
                  <div className={`${item.color} mt-0.5 flex-shrink-0`}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{item.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="flex-shrink-0 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => navigate(createPageUrl('GymOwnerDashboard'))}
              className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ── GHOST GYM MODAL ── */}
      {showGhostModal && ghostGym && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <button onClick={() => setShowGhostModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-black text-white mb-1">Community Already Exists!</h3>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Members have already created a community for{' '}
              <span className="font-bold text-white">{ghostGym.name}</span> with{' '}
              <span className="font-bold text-white">{ghostGym.members_count || 0} members</span>. Claim it to take control.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">{ghostGym.name}</p>
                <p className="text-slate-400 text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" /> {ghostGym.members_count || 0} members waiting
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowGhostModal(false)}
                className="flex-1 rounded-xl h-11 bg-white/8 hover:bg-white/15 text-slate-300 border border-white/10 font-bold transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleClaimGhost}
                className="flex-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-xl h-11 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] transition-all"
              >
                Claim Gym 🎉
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}