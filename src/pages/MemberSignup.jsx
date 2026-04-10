import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User, Camera, ArrowRight, QrCode, Search, CheckCircle2,
  Trophy, BarChart2, Zap, Users, Dumbbell, TrendingUp,
  Sparkles, Building2, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function MemberSignup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2
  const [joinMethod, setJoinMethod] = useState('code');
  const [gymCode, setGymCode] = useState('');
  const [joiningGym, setJoiningGym] = useState(false);
  const [joinedGym, setJoinedGym] = useState(null);
  const [showJoinSuccess, setShowJoinSuccess] = useState(false);
  const [gymSearchInput, setGymSearchInput] = useState('');
  const [gymSearchResults, setGymSearchResults] = useState([]);
  const [searchingGyms, setSearchingGyms] = useState(false);

  // Step 4
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: '',
    goal_days_per_week: 3
  });
  const [uploading, setUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const fileRef = useRef();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const searchGyms = async (q) => {
    if (!q.trim() || q.length < 2) { setGymSearchResults([]); return; }
    setSearchingGyms(true);
    try {
      const results = await base44.entities.Gym.filter({ name: q });
      setGymSearchResults(results || []);
    } catch { setGymSearchResults([]); }
    finally { setSearchingGyms(false); }
  };

  const handleJoinByCode = async () => {
    if (!gymCode.trim()) return;
    setJoiningGym(true);
    try {
      const gyms = await base44.entities.Gym.filter({ join_code: gymCode.toUpperCase() });
      if (!gyms || gyms.length === 0) {
        toast.error('No gym found with that code. Check and try again.');
        return;
      }
      await joinGym(gyms[0]);
    } catch {
      toast.error('Failed to join gym. Please try again.');
    } finally {
      setJoiningGym(false);
    }
  };

  const joinGym = async (gym) => {
    try {
      const user = await base44.auth.me();
      const existing = await base44.entities.GymMembership.filter({ user_id: user.id, gym_id: gym.id });
      if (existing.length === 0) {
        await base44.entities.GymMembership.create({
          user_id: user.id,
          user_name: user.full_name || formData.name,
          user_email: user.email,
          gym_id: gym.id,
          gym_name: gym.name,
          status: 'active',
          join_date: new Date().toISOString().split('T')[0],
          membership_type: 'monthly'
        });
        // Auto-set as primary gym if user has no primary gym yet
        if (!user.primary_gym_id) {
          await base44.auth.updateMe({ primary_gym_id: gym.id });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        }
      }
      setJoinedGym(gym);
      setShowJoinSuccess(true);
    } catch {
      toast.error('Failed to join gym.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = ev => setCoverPreview(ev.target.result);
      reader.readAsDataURL(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(p => ({ ...p, avatar_url: file_url }));
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const updates = {
        account_type: 'personal',
        onboarding_completed: true
      };
      if (formData.name) updates.full_name = formData.name;
      if (formData.bio) updates.bio = formData.bio;
      if (formData.avatar_url) updates.avatar_url = formData.avatar_url;
      if (formData.goal_days_per_week) updates.goal_days_per_week = formData.goal_days_per_week;
      await base44.auth.updateMe(updates);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setStep(5);
    } catch {
      toast.error('Failed to save profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-start py-4 sm:py-8 px-3 sm:px-4 relative overflow-hidden" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full mx-auto relative z-10 max-w-md px-0 sm:px-2">

        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
            alt="CoStride"
            className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-blue-500/30"
          />
        </div>

        {/* Progress bar */}
        {step >= 2 && step <= 4 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Step {step - 1} of 3</span>
              <span>{Math.round(((step - 2) / 2) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${((step - 2) / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 1: WELCOME ── */}
        {step === 1 && (
         <div className="space-y-4 sm:space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-500/30 rounded-full px-3 py-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold text-blue-300">Your gym. Your community.</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                Train Together.<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Go Further.
                </span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                Join your gym's private community. Check in. Compete. Stay accountable.
              </p>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'].map((c, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold`}>
                    {['A', 'M', 'J', 'K'][i]}
                  </div>
                ))}
              </div>
              <span className="text-slate-400 text-xs">2,400+ members already crushing it</span>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Zap className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Daily Check-ins' },
                { icon: <Trophy className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Gym Challenges' },
                { icon: <Users className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Gym Community' },
                { icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Progress Tracking' },
              ].map((f, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-3 rounded-2xl border ${f.bg}`}>
                  <div className={f.color}>{f.icon}</div>
                  <span className="text-white text-xs font-bold">{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-2.5">
              <Button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-14 text-base shadow-[0_4px_0_0_#1a3fa8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                Join Your Community <ArrowRight className="w-5 h-5" />
              </Button>
              <button
                onClick={() => navigate(createPageUrl('GymSignup'))}
                className="w-full h-12 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                I'm a Gym Owner
              </button>
            </div>
            <p className="text-center text-xs text-slate-600">Free to join • No subscription needed</p>
          </div>
        )}

        {/* ── STEP 2: JOIN GYM ── */}
        {step === 2 && (
         <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Join Your Gym</h2>
              <p className="text-slate-400 text-sm mt-1">Enter your gym's code or search for your community</p>
            </div>

            {/* Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/60 rounded-2xl border border-white/10">
              {['code', 'find'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setJoinMethod(m)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    joinMethod === m
                      ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'code' ? '🔑 Enter Code' : '🔍 Find Gym'}
                </button>
              ))}
            </div>

            {/* Enter code */}
            {joinMethod === 'code' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                  <QrCode className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-blue-300 font-medium">
                    Ask your gym for their 6-digit code or scan the QR poster at reception
                  </p>
                </div>

                <div>
                  <Label className="text-white font-bold text-sm mb-1.5 block">Gym Code</Label>
                  <Input
                    value={gymCode}
                    onChange={e => setGymCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABC123"
                    maxLength={6}
                    className="rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 h-14 text-center tracking-[0.3em] font-black text-2xl"
                  />
                  <p className="text-xs text-slate-500 mt-1.5 text-center">{gymCode.length}/6 characters</p>
                </div>

                <Button
                  type="button"
                  onClick={handleJoinByCode}
                  disabled={gymCode.length !== 6 || joiningGym}
                  className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {joiningGym
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Joining...</>
                    : <>Join Community <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            )}

            {/* Find gym */}
            {joinMethod === 'find' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    value={gymSearchInput}
                    onChange={e => { setGymSearchInput(e.target.value); searchGyms(e.target.value); }}
                    placeholder="Search for your gym..."
                    className="rounded-2xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 pl-10 h-12 text-sm"
                  />
                  {searchingGyms && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />}
                </div>

                {gymSearchResults.length > 0 && (
                  <div className="bg-slate-900/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    {gymSearchResults.slice(0, 6).map((gym, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => joinGym(gym)}
                        className="w-full text-left px-4 py-3 hover:bg-white/8 transition-colors border-b border-white/5 last:border-0 flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <Dumbbell className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm">{gym.name}</p>
                          <p className="text-xs text-slate-400 truncate">{gym.address || gym.city}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                          <Users className="w-3 h-3" /> {gym.members_count || 0}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {gymSearchInput && gymSearchResults.length === 0 && !searchingGyms && (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-slate-500 text-sm">No gyms found. Try a different name.</p>
                    <button
                      type="button"
                      onClick={() => navigate(createPageUrl('Explore'))}
                      className="text-blue-400 text-xs font-bold hover:underline"
                    >
                      Browse all gyms →
                    </button>
                  </div>
                )}

                {!gymSearchInput && (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 bg-slate-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-sm">Search for your gym above</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              Skip for now — I'll join a gym later →
            </button>
          </div>
        )}

        {/* ── STEP 3: HOW IT WORKS ── */}
        {step === 3 && (
         <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Here's How It Works</h2>
              <p className="text-slate-400 text-sm mt-1">Everything you need to crush your goals</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  icon: <Zap className="w-6 h-6" />, color: 'text-amber-400',
                  bg: 'bg-amber-500/15 border-amber-500/25', num: '01',
                  title: 'Check In', tag: 'Core Feature',
                  desc: 'Tap check-in when you arrive at the gym. Build your streak and stay consistent.'
                },
                {
                  icon: <Dumbbell className="w-6 h-6" />, color: 'text-blue-400',
                  bg: 'bg-blue-500/15 border-blue-500/25', num: '02',
                  title: "Today's Workout", tag: 'Log & Track',
                  desc: 'Log your sets, reps and weights. Track what you lifted and beat it next time.'
                },
                {
                  icon: <Trophy className="w-6 h-6" />, color: 'text-purple-400',
                  bg: 'bg-purple-500/15 border-purple-500/25', num: '03',
                  title: 'Challenges', tag: 'Compete',
                  desc: 'Compete in gym-wide challenges. Climb the leaderboard and earn badges.'
                },
                {
                  icon: <BarChart2 className="w-6 h-6" />, color: 'text-emerald-400',
                  bg: 'bg-emerald-500/15 border-emerald-500/25', num: '04',
                  title: 'Analytics', tag: 'Insights',
                  desc: 'See your progress over time — volume, frequency, streaks and personal records.'
                },
              ].map((f, i) => (
                <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border ${f.bg}`}>
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 ${f.color}`}>
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-white font-black text-sm">{f.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.bg} ${f.color} border`}>{f.tag}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                  <span className="text-slate-700 font-black text-lg flex-shrink-0">{f.num}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/8 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center justify-center"
              >←</Button>
              <Button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
              >
                Set Up My Profile <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: PROFILE SETUP ── */}
        {step === 4 && (
         <div className="space-y-4 sm:space-y-5">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Set Up Your Profile</h2>
              <p className="text-slate-400 text-sm mt-1">How will your gym community know you?</p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-4 border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-blue-400/50 transition-colors"
                >
                  {coverPreview
                    ? <img src={coverPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : <User className="w-10 h-10 text-slate-400" />}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </div>
              <p className="text-slate-500 text-xs">{uploading ? 'Uploading...' : 'Tap to add a photo'}</p>
            </div>

            {/* Name */}
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 block">
                Your Name * <span className="text-slate-500 font-normal">({formData.name.length}/15)</span>
              </Label>
              <Input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value.slice(0, 15) }))}
                placeholder="Enter your name"
                maxLength={15}
                className="rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 h-11 text-sm"
              />
            </div>

            {/* Bio */}
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 block">
                Bio <span className="text-slate-500 font-normal">(Optional)</span>
              </Label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell your gym what you're training for..."
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-slate-800/60 text-white placeholder:text-slate-500 text-sm p-3 resize-none focus:outline-none focus:border-blue-400/50 transition-colors"
              />
            </div>

            {/* Goal days */}
            <div>
              <Label className="text-white font-bold text-sm mb-1.5 block">
                How many days a week are you aiming for?
              </Label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, goal_days_per_week: d }))}
                    className={`aspect-square rounded-xl text-sm font-black transition-all border ${
                      formData.goal_days_per_week === d
                        ? 'bg-gradient-to-b from-blue-500 to-blue-700 border-blue-400/60 text-white shadow-[0_2px_0_0_#1a3fa8]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1.5 text-center">
                {formData.goal_days_per_week} {formData.goal_days_per_week === 1 ? 'day' : 'days'} per week
                {formData.goal_days_per_week >= 5 ? ' 🔥' : formData.goal_days_per_week >= 3 ? ' 💪' : ' 👍'}
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/8 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center justify-center"
              >←</Button>
              <Button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting || !formData.name}
                className="flex-1 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                  : <>Complete Setup <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: FIRST ACTION ── */}
        {step === 5 && (
         <div className="space-y-4 sm:space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome, {formData.name || 'Athlete'}!
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {joinedGym
                  ? `You're now part of the ${joinedGym.name} community`
                  : 'Your profile is ready — time to get to work'}
              </p>
            </div>

            {/* Primary action */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-900/20 border border-amber-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/25 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-black text-base">Check In Now</p>
                  <p className="text-slate-400 text-xs">Start your streak today</p>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                At the gym right now? Check in to officially kick off your journey and let your gym community know you're here. 💪
              </p>
              <Button
                type="button"
                onClick={() => navigate(createPageUrl('Home'))}
                className="w-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-900 font-black rounded-2xl h-13 text-base shadow-[0_3px_0_0_#92400e] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" /> Check In & Start Workout
              </Button>
            </div>

            {/* Secondary */}
            <div className="space-y-2">
              <p className="text-slate-500 text-xs text-center font-bold uppercase tracking-wider">Or explore first</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Dumbbell className="w-4 h-4" />, label: 'Log a Workout', color: 'text-blue-400' },
                  { icon: <Trophy className="w-4 h-4" />, label: 'View Challenges', color: 'text-purple-400' },
                  { icon: <Users className="w-4 h-4" />, label: 'Community Feed', color: 'text-emerald-400' },
                  { icon: <BarChart2 className="w-4 h-4" />, label: 'My Progress', color: 'text-cyan-400' },
                ].map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigate(createPageUrl('Home'))}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  >
                    <div className={a.color}>{a.icon}</div>
                    <span className="text-white text-xs font-bold">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => navigate(createPageUrl('Home'))}
              className="w-full bg-white/8 hover:bg-white/15 text-slate-300 font-bold rounded-2xl h-11 border border-white/10 transition-all text-sm"
            >
              Go to Home →
            </Button>
          </div>
        )}
      </div>

      {/* ── JOIN SUCCESS MODAL ── */}
      {showJoinSuccess && joinedGym && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end justify-center p-4"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div
            className="w-full max-w-md bg-slate-800/98 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            style={{ animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {joinedGym.cover_photo_url ? (
              <div className="relative h-40 overflow-hidden">
                <img src={joinedGym.cover_photo_url} alt={joinedGym.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              </div>
            ) : (
              <div className="h-32 bg-gradient-to-br from-blue-600/40 to-blue-900/40 flex items-center justify-center">
                <Dumbbell className="w-12 h-12 text-blue-400/50" />
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-black text-lg">You're in! 🎉</p>
                  <p className="text-slate-400 text-sm">Welcome to the community</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-black">{joinedGym.name}</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" /> {(joinedGym.members_count || 0) + 1} members • You just joined
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => { setShowJoinSuccess(false); setStep(3); }}
                className="w-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-2xl h-12 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] transition-all flex items-center justify-center gap-2"
              >
                Continue Setup <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}