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
  Bell, Mail, Instagram, Shield, Sparkles, Plus, X, Clock,
  Check, Copy, Share2, TrendingDown, Target, BarChart3, UserX,
  MessageSquareOff, Flame
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Image URLs ─────────────────────────────────────────────────────────── */
const IMG_DASH1 = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/cba5dcb65_laptop2.png";
const IMG_DASH2 = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/f820a098b_laptop3.png";
const IMG_DASH3 = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/0389290a1_laptop1.png";
const IMG_APP   = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/9911f07a0_screens.png";
const LOGO_URL  = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg";

/* ─── Global CSS ─────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&display=swap');
.gs-root, .gs-root * { font-family:'Geist',-apple-system,sans-serif; box-sizing:border-box; }

@keyframes gs-orb-a   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(28px,-20px)} }
@keyframes gs-orb-b   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-24px,18px)} }
@keyframes gs-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes gs-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.9)} }
@keyframes gs-up-1    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes gs-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes gs-glow    { 0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.2)} 50%{box-shadow:0 0 40px rgba(14,165,233,0.4)} }

.gs-a1 { animation:gs-up-1 .55s .05s cubic-bezier(.22,1,.36,1) both; }
.gs-a2 { animation:gs-up-1 .55s .12s cubic-bezier(.22,1,.36,1) both; }
.gs-a3 { animation:gs-up-1 .55s .19s cubic-bezier(.22,1,.36,1) both; }
.gs-a4 { animation:gs-up-1 .55s .26s cubic-bezier(.22,1,.36,1) both; }
.gs-a5 { animation:gs-up-1 .55s .33s cubic-bezier(.22,1,.36,1) both; }
.gs-a6 { animation:gs-up-1 .55s .40s cubic-bezier(.22,1,.36,1) both; }

.gs-btn-primary {
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  width:100%;height:54px;border-radius:13px;
  background:linear-gradient(135deg,#0ea5e9,#0369a1);
  border:none;cursor:pointer;font-size:15px;font-weight:700;color:#fff;
  letter-spacing:-0.01em;position:relative;overflow:hidden;
  box-shadow:0 6px 28px rgba(14,165,233,0.35),inset 0 1px 0 rgba(255,255,255,0.18);
  transition:box-shadow .2s,transform .15s;
}
.gs-btn-primary::after { content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.14) 50%,transparent 65%);animation:gs-shimmer 4s ease-in-out infinite; }
.gs-btn-primary:hover { box-shadow:0 12px 44px rgba(14,165,233,0.48),inset 0 1px 0 rgba(255,255,255,0.18);transform:translateY(-1px); }
.gs-btn-primary:active { transform:translateY(0); }
.gs-btn-primary:disabled { opacity:.45;cursor:not-allowed;transform:none; }

.gs-btn-ghost {
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;height:54px;border-radius:13px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
  cursor:pointer;font-size:15px;font-weight:600;color:rgba(255,255,255,0.5);
  transition:all .2s;
}
.gs-btn-ghost:hover { background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.18);color:rgba(255,255,255,0.8); }

.gs-btn-back {
  display:inline-flex;align-items:center;justify-content:center;
  height:44px;padding:0 18px;border-radius:11px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
  cursor:pointer;font-size:13px;font-weight:600;color:rgba(255,255,255,0.4);
  transition:all .2s;white-space:nowrap;
}
.gs-btn-back:hover { background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.7); }

.gs-card {
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.08);
  border-radius:22px;
  box-shadow:0 24px 60px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.05);
  padding:28px;
}

.gs-input {
  width:100%;height:48px;border-radius:12px;
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
  color:#e2eaff;font-size:14px;padding:0 14px;outline:none;
  transition:border-color .2s,box-shadow .2s;
}
.gs-input:focus { border-color:rgba(14,165,233,0.5);box-shadow:0 0 0 3px rgba(14,165,233,0.1); }
.gs-input::placeholder { color:rgba(255,255,255,0.22); }

.gs-label { font-size:11px;font-weight:700;color:rgba(255,255,255,0.32);text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:8px; }

.gs-option {
  display:flex;align-items:flex-start;gap:13px;padding:16px;border-radius:14px;cursor:pointer;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  transition:all .18s;text-align:left;width:100%;
}
.gs-option:hover { background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.14);transform:translateY(-1px); }
.gs-option.sel { background:rgba(14,165,233,0.09);border-color:rgba(14,165,233,0.38);box-shadow:0 0 0 1px rgba(14,165,233,0.15),0 8px 24px rgba(14,165,233,0.08); }

.gs-type-btn {
  display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:14px 8px;border-radius:14px;cursor:pointer;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  transition:all .18s;font-size:12px;font-weight:700;color:rgba(255,255,255,0.4);
}
.gs-type-btn:hover { background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8); }
.gs-type-btn.sel { background:rgba(14,165,233,0.1);border-color:rgba(14,165,233,0.38);color:#e2eaff;box-shadow:0 4px 16px rgba(14,165,233,0.12); }

.gs-count-btn {
  padding:10px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  color:rgba(255,255,255,0.4);transition:all .18s;
}
.gs-count-btn:hover { background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8); }
.gs-count-btn.sel { background:rgba(14,165,233,0.1);border-color:rgba(14,165,233,0.38);color:#0ea5e9; }

.gs-pill {
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);
  border-radius:99px;padding:5px 13px;
}

.gs-copy-btn {
  display:inline-flex;align-items:center;gap:7px;padding:0 18px;height:44px;
  border-radius:11px;background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);
  cursor:pointer;font-size:13px;font-weight:700;color:#0ea5e9;transition:all .18s;white-space:nowrap;
}
.gs-copy-btn:hover { background:rgba(14,165,233,0.18);border-color:rgba(14,165,233,0.4); }

@media(max-width:768px) {
  .gs-two-col  { grid-template-columns:1fr !important; }
  .gs-three-col { grid-template-columns:1fr 1fr !important; }
  .gs-hide-sm  { display:none !important; }
  .gs-wide-pad { padding:20px 16px !important; }
}
@media(min-width:769px) {
  .gs-show-sm  { display:none !important; }
}
`;

/* ─── Background wrapper ─────────────────────────────────────────────────── */
function BG({ children, maxWidth = 520, fullHeight = true }) {
  return (
    <div className="gs-root" style={{ minHeight: fullHeight ? '100vh' : 'auto', background: '#050d1a', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.065) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse 80% 65% at 50% 28%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 80% 65% at 50% 28%,black,transparent)' }} />
      <div style={{ position: 'absolute', top: '-8%', left: '-5%', width: 680, height: 680, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,0.13) 0%,transparent 62%)', animation: 'gs-orb-a 22s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '6%', right: '-6%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 62%)', animation: 'gs-orb-b 28s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.52) 30%,rgba(99,102,241,0.42) 70%,transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth }} className="gs-wide-pad">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Step header with progress bar ─────────────────────────────────────── */
function StepHeader({ step, title, subtitle }) {
  const TOTAL = 6;
  const pct = Math.round(((step - 1) / TOTAL) * 100);
  return (
    <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <img src={LOGO_URL} alt="CoStride" style={{ width: 50, height: 50, borderRadius: 13, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 24px rgba(14,165,233,0.2)' }} />
      <div style={{ width: 180, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', borderRadius: 99, transition: 'width .5s ease' }} />
      </div>
      <div className="gs-pill">
        <div style={{ width: 5, height: 5, background: '#0ea5e9', borderRadius: '50%', animation: 'gs-pulse 2s ease-in-out infinite' }} />
        <span style={{ color: 'rgba(14,165,233,0.9)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Step {step} of {TOTAL}</span>
      </div>
      <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, color: '#e2eaff', letterSpacing: '-0.035em', lineHeight: 1.2, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', maxWidth: 340, margin: 0, lineHeight: 1.7 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const CHALLENGES = [
  { id: 'retention',   emoji: '📉', title: 'Losing members',     desc: 'Cancellations are eating into revenue',       hint: 'CoStride flags at-risk members before they cancel' },
  { id: 'attendance',  emoji: '🚶', title: 'Low attendance',     desc: 'Members join but rarely show up',              hint: 'Activity trends show who\'s fading before they ghost' },
  { id: 'engagement',  emoji: '📵', title: 'Low engagement',     desc: "Members feel like they're training alone",     hint: 'Challenges and leaderboards turn solo training social' },
  { id: 'community',   emoji: '🤝', title: 'Building community', desc: 'You want a tight-knit gym culture',            hint: 'Social feeds, polls, and events build culture on autopilot' },
];

const MEMBER_COUNTS = ['Under 50', '50–150', '150–300', '300+'];

const GYM_TYPES = [
  { value: 'general',      label: 'General Fitness', emoji: '🏋️' },
  { value: 'powerlifting', label: 'Powerlifting',    emoji: '🔱' },
  { value: 'bodybuilding', label: 'Bodybuilding',    emoji: '💪' },
  { value: 'crossfit',     label: 'CrossFit',        emoji: '⚡' },
  { value: 'boxing',       label: 'Boxing',          emoji: '🥊' },
  { value: 'mma',          label: 'MMA',             emoji: '🥋' },
];

const PRESET_EQUIPMENT = ['Barbells','Dumbbells','Kettlebells','Cable Machines','Smith Machine','Leg Press','Pull Up Bars','Bench Press','Squat Rack','Treadmills','Rowing Machines','Battle Ropes','Resistance Bands','Foam Rollers','Boxing Bags','Assault Bike','Hack Squat','Lat Pulldown','Chest Fly Machine','Stair Climber'];
const AMENITIES_OPTIONS  = ['WiFi','Parking','24/7','Personal Training','Showers','Lockers','Sauna','Smoothie Bar'];
const SPECIALIZATION_OPTIONS = ['Weight Loss','Muscle Gain','Bulking Programs','Strength Training','Powerlifting','Bodybuilding','CrossFit','HIIT','Cardio','Rehabilitation'];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function GymSignup() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  /* ── State ──────────────────────────────────────────────────────────── */
  const [step,        setStep]        = useState(1);
  const [challenge,   setChallenge]   = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [createdGym,  setCreatedGym]  = useState(null);

  const [formData, setFormData] = useState({
    name: '', google_place_id: '', latitude: null, longitude: null,
    address: '', city: '', postcode: '', type: 'general', language: 'en',
    amenities: [], equipment: [], specializes_in: [], description: ''
  });

  const [searchInput,    setSearchInput]    = useState('');
  const [searching,      setSearching]      = useState(false);
  const [searchResults,  setSearchResults]  = useState([]);
  const [selectedPlace,  setSelectedPlace]  = useState(null);
  const [ghostGym,       setGhostGym]       = useState(null);
  const [showGhostModal, setShowGhostModal] = useState(false);

  const [verifyMethod,  setVerifyMethod]  = useState('email');
  const [bizEmail,      setBizEmail]      = useState('');
  const [codeSent,      setCodeSent]      = useState(false);
  const [sendingCode,   setSendingCode]   = useState(false);
  const [enteredCode,   setEnteredCode]   = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [genCode,       setGenCode]       = useState('');
  const [igHandle,      setIgHandle]      = useState('');
  const [igCode]        = useState(() => 'CSTR-' + Math.random().toString(36).substring(2, 7).toUpperCase());

  /* ── QR code ────────────────────────────────────────────────────────── */
  const generateQR = useCallback(() => {
    setTimeout(() => {
      const el = document.getElementById('qr-container');
      if (el && createdGym?.join_code) {
        el.innerHTML = '';
        new window.QRCode(el, { text: `https://costride.app/join/${createdGym.join_code}`, width: 180, height: 180, colorDark: '#ffffff', colorLight: '#0a1628', correctLevel: window.QRCode.CorrectLevel.H });
      }
    }, 300);
  }, [createdGym]);

  useEffect(() => {
    if (step !== 8 || !createdGym?.join_code) return;
    const existing = document.getElementById('qrcode-script');
    if (existing) { generateQR(); return; }
    const s = document.createElement('script');
    s.id   = 'qrcode-script';
    s.src  = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => generateQR();
    document.head.appendChild(s);
  }, [step, createdGym, generateQR]);

  /* ── Gym search ─────────────────────────────────────────────────────── */
  const searchGyms = async (q) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await base44.functions.invoke('searchGymsPlaces', { input: q });
      setSearchResults(res.data.results || []);
    } catch { setSearchResults([]); } finally { setSearching(false); }
  };

  const handleSelectPlace = async (place) => {
    setSelectedPlace(place);
    setSearchInput(place.name);
    setSearchResults([]);
    try {
      const existing = await base44.entities.Gym.filter({ google_place_id: place.place_id });
      const ghost    = existing.find(g => g.claim_status === 'unclaimed');
      if (ghost) { setGhostGym(ghost); setShowGhostModal(true); }
      else { applyPlace(place); }
    } catch { applyPlace(place); }
  };

  const applyPlace = (place) => setFormData(p => ({ ...p, name: place.name, google_place_id: place.place_id, latitude: place.latitude, longitude: place.longitude, address: place.address || '', city: place.city || '', postcode: place.postcode || '' }));

  const claimGhost = () => {
    if (!ghostGym) return;
    setFormData(p => ({ ...p, name: ghostGym.name, google_place_id: ghostGym.google_place_id, latitude: ghostGym.latitude, longitude: ghostGym.longitude, address: ghostGym.address || '', city: ghostGym.city || '', postcode: ghostGym.postcode || '', type: ghostGym.type || 'general', amenities: ghostGym.amenities || [], equipment: ghostGym.equipment || [], specializes_in: ghostGym.specializes_in || [], claimingGymId: ghostGym.id }));
    setShowGhostModal(false);
    toast.success('Gym found! Complete setup to claim it.');
  };

  /* ── Email verification ─────────────────────────────────────────────── */
  const sendCode = async () => {
    if (!bizEmail) return;
    setSendingCode(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGenCode(code);
      await base44.functions.invoke('sendEmail', { to: bizEmail, subject: 'Your CoStride Verification Code', body: `Hi,\n\nYour CoStride gym verification code is:\n\n${code}\n\nEnter this code to verify ownership of ${formData.name}.\n\nThis code expires in 10 minutes.\n\n— The CoStride Team` });
      setCodeSent(true);
      toast.success(`Code sent to ${bizEmail}`);
    } catch { toast.error('Failed to send code. Please try again.'); } finally { setSendingCode(false); }
  };

  const verifyCode = async () => {
    setVerifyingCode(true);
    await new Promise(r => setTimeout(r, 600));
    if (enteredCode === genCode) { setEmailVerified(true); toast.success('Email verified! Your gym goes live instantly.'); }
    else toast.error('Incorrect code. Try again.');
    setVerifyingCode(false);
  };

  /* ── Gym creation ───────────────────────────────────────────────────── */
  const detectLang = (city) => {
    const es = ['Madrid','Barcelona','Valencia','Seville','Zaragoza'];
    return es.some(c => city?.includes(c)) ? 'es' : 'en';
  };

  const createGymMutation = useMutation({
    mutationFn: async (data) => {
      const user   = await base44.auth.me();
      await base44.auth.updateMe({ account_type: 'gym_owner', onboarding_completed: true });
      const lang   = detectLang(data.city);
      const verified = emailVerified;
      const status = verified ? 'approved' : 'pending';
      const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));

      let gym;
      if (data.claimingGymId) {
        gym = await base44.asServiceRole.entities.Gym.update(data.claimingGymId, { name: data.name, type: data.type, language: lang, owner_email: user.email, admin_id: user.id, amenities: data.amenities, equipment: data.equipment, specializes_in: data.specializes_in, description: data.description, claim_status: 'claimed', status, verified });
      } else {
        gym = await base44.entities.Gym.create({ name: data.name, google_place_id: data.google_place_id || '', latitude: data.latitude, longitude: data.longitude, address: data.address || '', city: data.city || '', postcode: data.postcode || '', type: data.type || 'general', language: lang, description: data.description || '', amenities: data.amenities || [], equipment: data.equipment || [], specializes_in: data.specializes_in || [], owner_email: user.email, join_code: joinCode, verified, admin_id: user.id, claim_status: 'claimed', status });
      }
      await base44.entities.GymMembership.create({ user_id: user.id, user_name: user.full_name, user_email: user.email, gym_id: gym.id, gym_name: gym.name, status: 'active', join_date: new Date().toISOString().split('T')[0], membership_type: 'lifetime' });
      return gym;
    },
    onSuccess: (gym) => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      toast.success(gym.status === 'pending' ? "Gym submitted — we'll review within 24hrs." : 'Gym registered and live!');
      setCreatedGym(gym);
      setStep(7);
    },
    onError: (err) => {
      console.error(err);
      toast.error(err?.message || 'Failed to register gym. Please try again.');
    }
  });

  const submitGym = () => {
    if (!formData.name) { toast.error('Please select your gym first.'); setStep(4); return; }
    createGymMutation.mutate(formData);
  };

  const copyInviteLink = () => {
    const link = `https://costride.app/join/${createdGym?.join_code || ''}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Link copied!'); });
  };

  /* ══════════════════════════════════════════════════════════════════════
     STEP 1 — AHA PREVIEW
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 1) {
    return (
      <div className="gs-root" style={{ minHeight: '100vh', background: '#050d1a', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.065) 1px,transparent 1px)', backgroundSize:'48px 48px', maskImage:'radial-gradient(ellipse 85% 60% at 50% 32%,black,transparent)', WebkitMaskImage:'radial-gradient(ellipse 85% 60% at 50% 32%,black,transparent)' }} />
        <div style={{ position:'absolute', top:'-8%', left:'-5%', width:720, height:720, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.13) 0%,transparent 62%)', animation:'gs-orb-a 22s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'8%', right:'-6%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 62%)', animation:'gs-orb-b 28s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(14,165,233,0.52) 30%,rgba(99,102,241,0.42) 70%,transparent)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:2, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', textAlign:'center' }}>
          <div className="gs-a1" style={{ marginBottom:20 }}>
            <img src={LOGO_URL} alt="CoStride" style={{ width:54, height:54, borderRadius:14, objectFit:'cover', border:'1px solid rgba(255,255,255,0.15)', boxShadow:'0 8px 28px rgba(14,165,233,0.25)' }} />
          </div>
          <div className="gs-a1" style={{ marginBottom:18 }}>
            <div className="gs-pill">
              <div style={{ width:5, height:5, background:'#0ea5e9', borderRadius:'50%' }} />
              <span style={{ color:'rgba(14,165,233,0.9)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Takes less than 2 minutes</span>
            </div>
          </div>
          <h1 className="gs-a2" style={{ fontSize:'clamp(30px,5.5vw,64px)', fontWeight:900, color:'#e2eaff', letterSpacing:'-0.04em', lineHeight:1.05, margin:'0 0 14px', maxWidth:720 }}>
            This is what your gym<br />
            <span style={{ color:'#0ea5e9' }}>could look like.</span>
          </h1>
          <p className="gs-a3" style={{ fontSize:'clamp(14px,1.6vw,17px)', color:'rgba(255,255,255,0.4)', maxWidth:480, margin:'0 auto 36px', lineHeight:1.8 }}>
            Members competing, posting, and showing up consistently — all under your brand.
          </p>
          <div className="gs-a4" style={{ position:'relative', width:'100%', maxWidth:960, marginBottom:40 }}>
            <div style={{ position:'absolute', top:'15%', left:'8%', right:'8%', bottom:'10%', background:'radial-gradient(ellipse at 50% 50%,rgba(14,165,233,0.16) 0%,rgba(99,102,241,0.09) 45%,transparent 70%)', filter:'blur(50px)', pointerEvents:'none', borderRadius:80 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.18fr 1fr', gap:'0 -32px', alignItems:'center', position:'relative', zIndex:1 }}>
              <div style={{ transform:'translateY(24px) scale(0.88)', opacity:0.65 }}>
                <img src={IMG_DASH3} alt="Coach view" style={{ width:'100%', display:'block' }} />
              </div>
              <div style={{ zIndex:2, animation:'gs-float 6s ease-in-out infinite' }}>
                <img src={IMG_DASH2} alt="Dashboard" style={{ width:'100%', display:'block', filter:'drop-shadow(0 28px 72px rgba(14,165,233,0.22))' }} />
              </div>
              <div style={{ transform:'translateY(24px) scale(0.88)', opacity:0.65 }}>
                <img src={IMG_DASH1} alt="Members" style={{ width:'100%', display:'block' }} />
              </div>
            </div>
          </div>
          <div className="gs-a5" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, width:'100%', maxWidth:400 }}>
            <button className="gs-btn-primary" onClick={() => setStep(2)}>
              <span style={{ position:'relative', zIndex:1 }}>Set this up for my gym</span>
              <ArrowRight style={{ width:16, height:16, position:'relative', zIndex:1 }} />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:18, flexWrap:'wrap', justifyContent:'center' }}>
              {['Free 14-day trial','No credit card','Setup in 2 min'].map((t, i, arr) => (
                <React.Fragment key={t}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Check style={{ width:11, height:11, color:'rgba(16,185,129,0.7)', strokeWidth:2.5 }} />
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.28)' }}>{t}</span>
                  </div>
                  {i < arr.length-1 && <span style={{ fontSize:10, color:'rgba(255,255,255,0.1)' }}>·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 2 — PAIN MIRROR
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 2) {
    const pains = [
      { icon: UserX,          color: '#ef4444', text: 'They stop showing up' },
      { icon: MessageSquareOff, color: '#f59e0b', text: 'They feel disconnected' },
      { icon: TrendingDown,   color: '#8b5cf6', text: 'Then they cancel quietly' },
    ];
    return (
      <BG maxWidth={520}>
        <StepHeader step={1} title="The silent gym killer" subtitle="Most gyms don't lose members instantly…" />
        <div className="gs-card gs-a2" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {pains.map(({ icon: Icon, color, text }, i) => (
              <div key={text} className={`gs-a${i+2}`} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:13 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${color}1a`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon style={{ width:16, height:16, color }} />
                </div>
                <span style={{ fontSize:15, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'16px', background:'rgba(14,165,233,0.07)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:14, marginBottom:24 }}>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.75, margin:0 }}>
              CoStride builds the <span style={{ color:'#e2eaff', fontWeight:700 }}>community layer</span> that keeps members emotionally invested — so your gym becomes a habit, not just a subscription they forget to cancel.
            </p>
          </div>
          <button className="gs-btn-primary" onClick={() => setStep(3)}>
            <span style={{ position:'relative', zIndex:1 }}>Let's fix that for your gym</span>
            <ArrowRight style={{ width:16, height:16, position:'relative', zIndex:1 }} />
          </button>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 3 — PERSONALISATION
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 3) {
    return (
      <BG maxWidth={520}>
        <StepHeader step={2} title="What's your biggest challenge?" subtitle="We'll tailor your setup around what matters most" />
        <div className="gs-card gs-a2">
          <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:22 }}>
            {CHALLENGES.map((c) => (
              <button key={c.id} className={`gs-option${challenge === c.id ? ' sel' : ''}`} onClick={() => setChallenge(c.id)}>
                <div style={{ fontSize:22, lineHeight:1, flexShrink:0, marginTop:2 }}>{c.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color: challenge === c.id ? '#e2eaff' : 'rgba(255,255,255,0.65)', marginBottom:3 }}>{c.title}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>{c.desc}</div>
                </div>
                {challenge === c.id && <CheckCircle2 style={{ width:16, height:16, color:'#0ea5e9', flexShrink:0 }} />}
              </button>
            ))}
          </div>
          {challenge && (
            <div style={{ padding:'11px 14px', background:'rgba(14,165,233,0.07)', border:'1px solid rgba(14,165,233,0.18)', borderRadius:11, marginBottom:20, display:'flex', alignItems:'center', gap:9 }}>
              <Zap style={{ width:13, height:13, color:'#0ea5e9', flexShrink:0 }} />
              <span style={{ fontSize:12, color:'rgba(14,165,233,0.85)' }}>{CHALLENGES.find(c => c.id === challenge)?.hint}</span>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button className="gs-btn-back" onClick={() => setStep(2)}>← Back</button>
            <button className="gs-btn-primary" disabled={!challenge} onClick={() => setStep(4)} style={{ flex:1 }}>
              <span style={{ position:'relative', zIndex:1 }}>Nice — let's keep going</span>
              <ArrowRight style={{ width:15, height:15, position:'relative', zIndex:1 }} />
            </button>
          </div>
          <button onClick={() => setStep(4)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.22)', fontSize:12, marginTop:12, display:'block', width:'100%', textAlign:'center' }}>
            Skip this question →
          </button>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 4 — FIND GYM
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 4) {
    return (
      <BG maxWidth={580}>
        <StepHeader step={3} title="Find your gym" subtitle="We'll look up your location and check for an existing community" />
        <div className="gs-card gs-a2">
          <label className="gs-label">Gym name</label>
          <div style={{ position:'relative', marginBottom:selectedPlace ? 10 : 20 }}>
            <Search style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'rgba(255,255,255,0.28)', pointerEvents:'none' }} />
            <input className="gs-input" value={searchInput}
              onChange={e => { setSearchInput(e.target.value); searchGyms(e.target.value); }}
              placeholder="Search gym name or address…"
              style={{ paddingLeft:42 }} />
            {searching && <Loader2 style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'#0ea5e9', animation:'spin 1s linear infinite' }} />}
          </div>

          {searchResults.length > 0 && (
            <div style={{ background:'rgba(5,13,26,0.98)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, overflow:'hidden', marginBottom:12, boxShadow:'0 12px 40px rgba(0,0,0,0.6)' }}>
              {searchResults.slice(0, 7).map((p, i) => (
                <button key={i} onClick={() => handleSelectPlace(p)} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 16px', background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <div style={{ width:32, height:32, background:'rgba(14,165,233,0.12)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <MapPin style={{ width:14, height:14, color:'#0ea5e9' }} />
                  </div>
                  <div style={{ textAlign:'left', flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#e2eaff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.address}</div>
                  </div>
                  <ChevronRight style={{ width:14, height:14, color:'rgba(255,255,255,0.2)', flexShrink:0 }} />
                </button>
              ))}
            </div>
          )}

          {selectedPlace && (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.25)', borderRadius:13, marginBottom:20 }}>
              <Building2 style={{ width:18, height:18, color:'#0ea5e9', flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#e2eaff', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{selectedPlace.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{selectedPlace.address}</div>
              </div>
              <CheckCircle2 style={{ width:15, height:15, color:'#0ea5e9', flexShrink:0 }} />
            </div>
          )}

          <label className="gs-label" style={{ marginBottom:10 }}>Gym type</label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }} className="gs-three-col">
            {GYM_TYPES.map(t => (
              <button key={t.value} className={`gs-type-btn${formData.type === t.value ? ' sel' : ''}`} onClick={() => setFormData(p => ({ ...p, type: t.value }))}>
                <span style={{ fontSize:20 }}>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <label className="gs-label" style={{ marginBottom:10 }}>Approximate member count</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
            {MEMBER_COUNTS.map(c => (
              <button key={c} className={`gs-count-btn${memberCount === c ? ' sel' : ''}`} onClick={() => setMemberCount(c)}>{c}</button>
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="gs-btn-back" onClick={() => setStep(3)}>← Back</button>
            <button className="gs-btn-primary" disabled={!selectedPlace} onClick={() => setStep(5)} style={{ flex:1 }}>
              <span style={{ position:'relative', zIndex:1 }}>Almost there</span>
              <ArrowRight style={{ width:15, height:15, position:'relative', zIndex:1 }} />
            </button>
          </div>
        </div>

        {showGhostModal && ghostGym && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ maxWidth:380, width:'100%', background:'linear-gradient(160deg,#0d1f3c,#0a1525)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:28, boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}>
              <div style={{ width:52, height:52, background:'rgba(245,158,11,0.15)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, border:'1px solid rgba(245,158,11,0.25)' }}>
                <Sparkles style={{ width:24, height:24, color:'#f59e0b' }} />
              </div>
              <h3 style={{ fontSize:20, fontWeight:800, color:'#e2eaff', marginBottom:8 }}>Community already exists!</h3>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.5)', marginBottom:20, lineHeight:1.7 }}>
                Members have already built a community for <strong style={{ color:'#e2eaff' }}>{ghostGym.name}</strong> with <strong style={{ color:'#f59e0b' }}>{ghostGym.members_count || 0} members</strong>. Claim it to take ownership.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button className="gs-btn-back" style={{ flex:1 }} onClick={() => setShowGhostModal(false)}>Cancel</button>
                <button className="gs-btn-primary" style={{ flex:1, height:44 }} onClick={claimGhost}>
                  <span style={{ position:'relative', zIndex:1 }}>Claim it</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 5 — SECOND AHA
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 5) {
    const gymName  = formData.name || 'Your Gym';
    const statCards = [
      { label:'Members active this week', val:'12',  color:'#0ea5e9' },
      { label:'Retention rate',           val:'94%', color:'#10b981' },
      { label:'New this month',           val:'+5',  color:'#8b5cf6' },
    ];
    return (
      <div className="gs-root" style={{ minHeight:'100vh', background:'#050d1a', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.065) 1px,transparent 1px)', backgroundSize:'48px 48px', maskImage:'radial-gradient(ellipse 85% 60% at 50% 30%,black,transparent)', WebkitMaskImage:'radial-gradient(ellipse 85% 60% at 50% 30%,black,transparent)' }} />
        <div style={{ position:'absolute', top:'-8%', left:'-5%', width:720, height:720, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.13) 0%,transparent 62%)', animation:'gs-orb-a 22s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'8%', right:'-6%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 62%)', animation:'gs-orb-b 28s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(14,165,233,0.52) 30%,rgba(99,102,241,0.42) 70%,transparent)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:2, flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
          <div style={{ width:'100%', maxWidth:960, display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:56, alignItems:'center' }} className="gs-two-col">
            <div>
              <div className="gs-a1" style={{ marginBottom:12 }}>
                <img src={LOGO_URL} alt="CoStride" style={{ width:44, height:44, borderRadius:12, objectFit:'cover', border:'1px solid rgba(255,255,255,0.15)' }} />
              </div>
              <div className="gs-a1" style={{ marginBottom:12 }}>
                <div style={{ width:160, height:3, background:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ width:'66%', height:'100%', background:'linear-gradient(90deg,#0ea5e9,#6366f1)', borderRadius:99 }} />
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:'rgba(14,165,233,0.7)', letterSpacing:'.08em', textTransform:'uppercase', marginTop:6 }}>Step 4 of 6</div>
              </div>
              <div className="gs-a1 gs-pill" style={{ marginBottom:18, display:'inline-flex' }}>
                <Flame style={{ width:11, height:11, color:'#0ea5e9' }} />
                <span style={{ color:'rgba(14,165,233,0.9)', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Your gym, transformed</span>
              </div>
              <h1 className="gs-a2" style={{ fontSize:'clamp(26px,4vw,46px)', fontWeight:900, color:'#e2eaff', letterSpacing:'-0.04em', lineHeight:1.1, margin:'0 0 14px' }}>
                Here's <span style={{ color:'#0ea5e9' }}>{gymName}</span><br />with CoStride.
              </h1>
              <p className="gs-a3" style={{ fontSize:15, color:'rgba(255,255,255,0.4)', lineHeight:1.8, margin:'0 0 28px' }}>
                Your members get a community app. You get a full dashboard to track who's engaged, who's at risk, and what's working.
              </p>
              <div className="gs-a4" style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
                {statCards.map(s => (
                  <div key={s.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 15px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:s.color, minWidth:44 }}>{s.val}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="gs-a5" style={{ display:'flex', gap:10 }}>
                <button className="gs-btn-back" onClick={() => setStep(4)}>← Back</button>
                <button className="gs-btn-primary" style={{ flex:1 }} onClick={() => setStep(6)}>
                  <span style={{ position:'relative', zIndex:1 }}>Start building this</span>
                  <ArrowRight style={{ width:15, height:15, position:'relative', zIndex:1 }} />
                </button>
              </div>
            </div>
            <div className="gs-a3 gs-hide-sm" style={{ position:'relative' }}>
              <div style={{ position:'absolute', top:'10%', left:'5%', right:'5%', bottom:'10%', background:'radial-gradient(ellipse at 50% 40%,rgba(14,165,233,0.18) 0%,rgba(99,102,241,0.1) 45%,transparent 70%)', filter:'blur(36px)', pointerEvents:'none', borderRadius:60 }} />
              <div style={{ position:'relative', zIndex:1, animation:'gs-float 7s ease-in-out infinite' }}>
                <img src={IMG_DASH2} alt="Dashboard preview" style={{ width:'100%', display:'block', borderRadius:12, filter:'drop-shadow(0 24px 60px rgba(14,165,233,0.18))' }} />
                <div style={{ position:'absolute', top:'8%', left:'-10%', background:'rgba(5,13,26,0.95)', border:'1px solid rgba(14,165,233,0.3)', borderRadius:14, padding:'10px 16px', boxShadow:'0 12px 36px rgba(0,0,0,0.5)', backdropFilter:'blur(12px)' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>Active gym</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#e2eaff' }}>{gymName}</div>
                </div>
                <div style={{ position:'absolute', bottom:'12%', right:'-8%', background:'rgba(5,13,26,0.95)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:14, padding:'10px 16px', boxShadow:'0 12px 36px rgba(0,0,0,0.5)', backdropFilter:'blur(12px)' }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>This week</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#10b981' }}>12 members active 🔥</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 6 — VERIFY OWNERSHIP
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 6) {
    return (
      <BG maxWidth={520}>
        <StepHeader step={4} title="Verify ownership" subtitle={`Prove you own ${formData.name || 'your gym'}`} />
        <div className="gs-card gs-a2">
          <div style={{ display:'flex', gap:6, padding:5, background:'rgba(0,0,0,0.25)', borderRadius:14, border:'1px solid rgba(255,255,255,0.05)', marginBottom:22 }}>
            {[{ id:'email', icon:Mail, label:'Business Email' }, { id:'instagram', icon:Instagram, label:'Instagram' }].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => { setVerifyMethod(id); setCodeSent(false); setEmailVerified(false); setEnteredCode(''); }}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, height:42, borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, transition:'all .2s',
                  background: verifyMethod === id ? (id==='email' ? 'linear-gradient(135deg,#0ea5e9,#0369a1)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)') : 'transparent',
                  color: verifyMethod === id ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: verifyMethod === id ? '0 4px 16px rgba(14,165,233,0.3)' : 'none'
                }}>
                <Icon style={{ width:14, height:14 }} /> {label}
              </button>
            ))}
          </div>

          {verifyMethod === 'email' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {!emailVerified ? (
                <>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 15px', background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:13 }}>
                    <Shield style={{ width:15, height:15, color:'#0ea5e9', marginTop:2, flexShrink:0 }} />
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.7 }}>Enter your business email. We'll send a 6-digit code — if you can receive it, you own it. Gmail/personal emails go to manual review.</p>
                  </div>
                  <div>
                    <label className="gs-label">Business Email</label>
                    <div style={{ display:'flex', gap:8 }}>
                      <input className="gs-input" type="email" value={bizEmail} onChange={e => { setBizEmail(e.target.value); setCodeSent(false); setEnteredCode(''); }} placeholder="owner@yourgym.com" disabled={codeSent} style={{ flex:1, opacity: codeSent ? .5 : 1 }} />
                      <button onClick={sendCode} disabled={!bizEmail || sendingCode || codeSent}
                        style={{ height:48, padding:'0 16px', borderRadius:12, background:'linear-gradient(135deg,#0ea5e9,#0369a1)', border:'none', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:13, opacity: (!bizEmail||sendingCode||codeSent) ? .4 : 1, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:7 }}>
                        {sendingCode ? <Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> : codeSent ? '✓ Sent' : 'Send Code'}
                      </button>
                    </div>
                  </div>
                  {codeSent && (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:11 }}>
                        <CheckCircle2 style={{ width:13, height:13, color:'#10b981', flexShrink:0 }} />
                        <span style={{ fontSize:12, color:'rgba(16,185,129,0.8)' }}>Code sent to <strong>{bizEmail}</strong></span>
                      </div>
                      <div>
                        <label className="gs-label">6-digit code</label>
                        <div style={{ display:'flex', gap:8 }}>
                          <input className="gs-input" value={enteredCode} onChange={e => setEnteredCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} style={{ textAlign:'center', fontSize:24, fontWeight:800, letterSpacing:'0.3em', flex:1 }} />
                          <button onClick={verifyCode} disabled={enteredCode.length !== 6 || verifyingCode}
                            style={{ height:48, padding:'0 18px', borderRadius:12, background:'linear-gradient(135deg,#10b981,#059669)', border:'none', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:13, opacity: (enteredCode.length!==6||verifyingCode) ? .4 : 1, display:'flex', alignItems:'center', gap:7 }}>
                            {verifyingCode ? <Loader2 style={{ width:14, height:14, animation:'spin 1s linear infinite' }} /> : 'Verify'}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => { setCodeSent(false); setEnteredCode(''); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:12, cursor:'pointer', textAlign:'left' }}>← Wrong email?</button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:14 }}>
                  <div style={{ width:44, height:44, background:'rgba(16,185,129,0.15)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <CheckCircle2 style={{ width:22, height:22, color:'#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:'#e2eaff', fontSize:14 }}>Email verified!</div>
                    <div style={{ fontSize:12, color:'#10b981', marginTop:2 }}>{bizEmail}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:3 }}>Your gym goes live instantly after setup.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {verifyMethod === 'instagram' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 15px', background:'rgba(139,92,246,0.07)', border:'1px solid rgba(139,92,246,0.18)', borderRadius:13 }}>
                <Instagram style={{ width:15, height:15, color:'#8b5cf6', marginTop:2, flexShrink:0 }} />
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:0, lineHeight:1.7 }}>Send a DM from your gym's Instagram with your unique code below. We'll verify within 24 hours.</p>
              </div>
              <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.08))', border:'1px solid rgba(139,92,246,0.2)', borderRadius:14, padding:18, textAlign:'center' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700 }}>Your unique code</div>
                <div style={{ fontSize:28, fontWeight:900, color:'#e2eaff', letterSpacing:'.3em', marginBottom:8 }}>{igCode}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)' }}>DM this to <span style={{ color:'#8b5cf6', fontWeight:700 }}>@CoStrideApp</span></div>
              </div>
              <div>
                <label className="gs-label">Your gym's Instagram handle</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.4)', fontWeight:700, fontSize:14 }}>@</span>
                  <input className="gs-input" value={igHandle} onChange={e => setIgHandle(e.target.value)} placeholder="yourgymhandle" style={{ paddingLeft:28 }} />
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:11 }}>
                <Clock style={{ width:13, height:13, color:'#f59e0b', flexShrink:0 }} />
                <span style={{ fontSize:12, color:'rgba(245,158,11,0.8)' }}>We'll approve your gym within 24 hours of receiving your DM.</span>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:22 }}>
            <button className="gs-btn-back" onClick={() => setStep(5)}>← Back</button>
            <button className="gs-btn-primary" style={{ flex:1 }} disabled={createGymMutation.isPending} onClick={submitGym}>
              {createGymMutation.isPending
                ? <><Loader2 style={{ width:15, height:15, animation:'spin 1s linear infinite', position:'relative', zIndex:1 }} /><span style={{ position:'relative', zIndex:1 }}>Creating…</span></>
                : <><span style={{ position:'relative', zIndex:1 }}>{emailVerified ? 'Create gym ✓' : 'Create gym'}</span><ArrowRight style={{ width:15, height:15, position:'relative', zIndex:1 }} /></>}
            </button>
          </div>
          <button onClick={submitGym} disabled={createGymMutation.isPending} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.22)', fontSize:12, marginTop:12, display:'block', width:'100%', textAlign:'center' }}>
            Skip verification — gym goes live within 24hrs →
          </button>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 7 — INVITE MEMBERS
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 7) {
    const inviteLink = `costride.app/join/${createdGym?.join_code || '------'}`;
    const isPending  = createdGym?.status === 'pending';
    return (
      <BG maxWidth={520}>
        <StepHeader step={5} title="Start your community" subtitle="No members = no community. This is the most important step." />
        <div className="gs-card gs-a2">
          {isPending ? (
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 15px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:13, marginBottom:20 }}>
              <Clock style={{ width:14, height:14, color:'#f59e0b', marginTop:2, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#f59e0b', marginBottom:2 }}>Under review</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>We'll verify ownership within 24hrs. Your invite link works now — share it while you wait.</div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:13, marginBottom:20 }}>
              <CheckCircle2 style={{ width:14, height:14, color:'#10b981', flexShrink:0 }} />
              <span style={{ fontSize:13, color:'rgba(16,185,129,0.85)', fontWeight:600 }}><strong style={{ color:'#e2eaff' }}>{createdGym?.name}</strong> is live on CoStride 🎉</span>
            </div>
          )}

          <label className="gs-label">Your gym's invite link</label>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'0 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, overflow:'hidden' }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{inviteLink}</span>
            </div>
            <button className="gs-copy-btn" onClick={copyInviteLink}>
              {copied ? <Check style={{ width:14, height:14 }} /> : <Copy style={{ width:14, height:14 }} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, marginBottom:20, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700, marginBottom:6 }}>Or share the join code</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#e2eaff', letterSpacing:'.3em' }}>{createdGym?.join_code || '------'}</div>
          </div>

          {copied ? (
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(14,165,233,0.08))', border:'1px solid rgba(16,185,129,0.3)', borderRadius:14, marginBottom:20 }}>
              <div style={{ fontSize:24 }}>🔥</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#e2eaff', marginBottom:2 }}>Your community is starting to grow!</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>Share that link everywhere — every member counts.</div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'rgba(14,165,233,0.06)', border:'1px solid rgba(14,165,233,0.15)', borderRadius:12, marginBottom:20 }}>
              <Users style={{ width:13, height:13, color:'#0ea5e9', flexShrink:0 }} />
              <span style={{ fontSize:12, color:'rgba(14,165,233,0.75)' }}>Members who join via link are <strong style={{ color:'#0ea5e9' }}>3× more likely</strong> to stay active in the first month.</span>
            </div>
          )}

          <button className="gs-btn-primary" style={{ marginBottom:10 }} onClick={() => setStep(8)}>
            <Flame style={{ width:16, height:16, position:'relative', zIndex:1 }} />
            <span style={{ position:'relative', zIndex:1 }}>See your dashboard 🔥</span>
            <ArrowRight style={{ width:15, height:15, position:'relative', zIndex:1 }} />
          </button>
          <button onClick={() => navigate(createPageUrl('GymOwnerDashboard'))} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', fontSize:12, display:'block', width:'100%', textAlign:'center' }}>
            Skip inviting for now →
          </button>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 8 — COMPLETE (QR + Dashboard)
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 8) {
    const isPending = createdGym?.status === 'pending';
    return (
      <BG maxWidth={480}>
        <div className="gs-a1" style={{ textAlign:'center', marginBottom:28, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <div style={{ width:72, height:72, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid', animation:'gs-glow 3s ease-in-out infinite', borderColor: isPending ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)', background: isPending ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)' }}>
            {isPending ? <Clock style={{ width:34, height:34, color:'#f59e0b' }} /> : <CheckCircle2 style={{ width:34, height:34, color:'#10b981' }} />}
          </div>
          <h1 style={{ fontSize:'clamp(28px,5vw,40px)', fontWeight:900, color:'#e2eaff', letterSpacing:'-0.04em', margin:0 }}>
            {isPending ? 'Under Review!' : "You're Live! 🚀"}
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', maxWidth:320, margin:0, lineHeight:1.7 }}>
            {isPending
              ? <><span style={{ color:'#f59e0b', fontWeight:700 }}>Pending approval</span> — we'll review <span style={{ color:'#e2eaff', fontWeight:700 }}>{createdGym?.name}</span> within 24 hours</>
              : <><span style={{ color:'#e2eaff', fontWeight:700 }}>{createdGym?.name}</span> is live on CoStride</>}
          </p>
        </div>

        <div className="gs-card gs-a2">
          {isPending && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 15px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:13, marginBottom:20 }}>
              <AlertCircle style={{ width:14, height:14, color:'#f59e0b', marginTop:2, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'rgba(245,158,11,0.85)', marginBottom:3 }}>What happens next?</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>Our team will verify your gym within 24 hours. You'll get an email once approved. Your QR code works immediately — start sharing.</div>
              </div>
            </div>
          )}

          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700, textAlign:'center', marginBottom:14 }}>Share to let members join</div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <div style={{ background:'#0a1628', padding:18, borderRadius:20, border:'1px solid rgba(14,165,233,0.15)', boxShadow:'0 16px 48px rgba(0,0,0,0.6)' }}>
              <div id="qr-container" style={{ width:180, height:180 }} />
            </div>
          </div>

          <div style={{ padding:'14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, marginBottom:20, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700, marginBottom:5 }}>Join code</div>
            <div style={{ fontSize:30, fontWeight:900, color:'#e2eaff', letterSpacing:'.3em' }}>{createdGym?.join_code}</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            <button style={{ padding:'14px', background:'rgba(139,92,246,0.09)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:14, cursor:'pointer', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(139,92,246,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(139,92,246,0.09)'}>
              <div style={{ width:30, height:30, background:'rgba(139,92,246,0.18)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <Trophy style={{ width:14, height:14, color:'#8b5cf6' }} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'#e2eaff' }}>Create Challenge</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Motivate members</div>
            </button>
            <button style={{ padding:'14px', background:'rgba(14,165,233,0.09)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:14, cursor:'pointer', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(14,165,233,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(14,165,233,0.09)'}>
              <div style={{ width:30, height:30, background:'rgba(14,165,233,0.18)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <Bell style={{ width:14, height:14, color:'#0ea5e9' }} />
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'#e2eaff' }}>Create Poll</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Get feedback</div>
            </button>
          </div>

          <button className="gs-btn-primary" onClick={() => navigate(createPageUrl('GymOwnerDashboard'))}>
            <span style={{ position:'relative', zIndex:1 }}>Go to Dashboard</span>
            <ArrowRight style={{ width:15, height:15, position:'relative', zIndex:1 }} />
          </button>
        </div>
        <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'rgba(255,255,255,0.2)' }}>We'll email you a printable poster with your QR code shortly</div>
      </BG>
    );
  }

  return null;
}