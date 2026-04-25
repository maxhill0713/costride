import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Dumbbell, Loader2, CheckCircle2, Search, MapPin, AlertCircle,
  ArrowRight, Building2, Users, Trophy, Zap, ChevronRight,
  Bell, Mail, Instagram, Shield, Plus, X, Clock,
  Check, Copy, Share2, TrendingDown, Target, BarChart3, UserX,
  MessageSquareOff, Activity, TrendingUp, AlertTriangle, Eye,
  ChevronDown, MoreHorizontal, Lock, Star
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Image URLs ─────────────────────────────────────────────────────────── */
const IMG_DASH1 = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/cba5dcb65_laptop2.png";
const IMG_DASH2 = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/f820a098b_laptop3.png";
const IMG_DASH3 = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/0389290a1_laptop1.png";
const IMG_APP   = "https://media.base44.com/images/public/user_694b6372713bbccc37eac3f3/9911f07a0_screens.png";
const LOGO_URL  = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg";
const POSE_1_URL = "https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png";

/* ─── Global CSS ─────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&display=swap');
.gs-root, .gs-root * { font-family:'Geist',-apple-system,sans-serif; box-sizing:border-box; }

@keyframes gs-orb-a   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(28px,-20px)} }
@keyframes gs-orb-b   { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-24px,18px)} }
@keyframes gs-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes gs-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.88)} }
@keyframes gs-up-1    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes gs-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes gs-glow    { 0%,100%{box-shadow:0 0 20px rgba(14,165,233,0.2)} 50%{box-shadow:0 0 40px rgba(14,165,233,0.4)} }
@keyframes spin        { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

.gs-a1 { animation:gs-up-1 .6s .05s cubic-bezier(.22,1,.36,1) both; }
.gs-a2 { animation:gs-up-1 .6s .15s cubic-bezier(.22,1,.36,1) both; }
.gs-a3 { animation:gs-up-1 .6s .25s cubic-bezier(.22,1,.36,1) both; }
.gs-a4 { animation:gs-up-1 .6s .35s cubic-bezier(.22,1,.36,1) both; }
.gs-a5 { animation:gs-up-1 .6s .45s cubic-bezier(.22,1,.36,1) both; }
.gs-a6 { animation:gs-up-1 .6s .55s cubic-bezier(.22,1,.36,1) both; }

.gs-btn-primary {
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  width:100%;height:clamp(48px, 6vh, 52px);border-radius:12px;
  background:linear-gradient(135deg,#0ea5e9,#0369a1);
  border:none;cursor:pointer;font-size:14px;font-weight:700;color:#fff;
  letter-spacing:-0.01em;position:relative;overflow:hidden;
  box-shadow:0 4px 24px rgba(14,165,233,0.28),inset 0 1px 0 rgba(255,255,255,0.15);
  transition:box-shadow .2s,transform .15s;
}
.gs-btn-primary::after { content:'';position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.1) 50%,transparent 65%);animation:gs-shimmer 5s ease-in-out infinite; }
.gs-btn-primary:hover { box-shadow:0 8px 36px rgba(14,165,233,0.42),inset 0 1px 0 rgba(255,255,255,0.15);transform:translateY(-1px); }
.gs-btn-primary:active { transform:translateY(0); }
.gs-btn-primary:disabled { opacity:.38;cursor:not-allowed;transform:none; }

.gs-btn-ghost {
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  width:100%;height:52px;border-radius:12px;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  cursor:pointer;font-size:14px;font-weight:600;color:rgba(255,255,255,0.45);
  transition:all .2s;
}
.gs-btn-ghost:hover { background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.15);color:rgba(255,255,255,0.75); }

.gs-btn-back {
  display:inline-flex;align-items:center;justify-content:center;
  height:44px;padding:0 16px;border-radius:11px;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
  cursor:pointer;font-size:13px;font-weight:600;color:rgba(255,255,255,0.38);
  transition:all .2s;white-space:nowrap;
}
.gs-btn-back:hover { background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.65); }

.gs-card {
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.07);
  border-radius:20px;
  box-shadow:0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04);
  padding:clamp(16px, 4vw, 28px);
}

.gs-input {
  width:100%;height:48px;border-radius:11px;
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);
  color:#e2eaff;font-size:14px;padding:0 14px;outline:none;
  transition:border-color .2s,box-shadow .2s;
}
.gs-input:focus { border-color:rgba(14,165,233,0.45);box-shadow:0 0 0 3px rgba(14,165,233,0.08); }
.gs-input::placeholder { color:rgba(255,255,255,0.2); }

.gs-label { font-size:11px;font-weight:700;color:rgba(255,255,255,0.28);text-transform:uppercase;letter-spacing:.12em;display:block;margin-bottom:8px; }

.gs-option {
  display:flex;align-items:flex-start;gap:13px;padding:16px;border-radius:13px;cursor:pointer;
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
  transition:all .18s;text-align:left;width:100%;
}
.gs-option:hover { background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.12); }
.gs-option.sel { background:rgba(14,165,233,0.08);border-color:rgba(14,165,233,0.35);box-shadow:0 0 0 1px rgba(14,165,233,0.12); }

.gs-type-btn {
  display:flex;flex-direction:column;align-items:center;gap:7px;
  padding:14px 8px;border-radius:13px;cursor:pointer;
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
  transition:all .18s;font-size:12px;font-weight:700;color:rgba(255,255,255,0.38);
}
.gs-type-btn:hover { background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.75); }
.gs-type-btn.sel { background:rgba(14,165,233,0.09);border-color:rgba(14,165,233,0.35);color:#e2eaff;box-shadow:0 2px 12px rgba(14,165,233,0.1); }

.gs-count-btn {
  padding:10px 16px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:700;
  background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);
  color:rgba(255,255,255,0.38);transition:all .18s;
}
.gs-count-btn:hover { background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.75); }
.gs-count-btn.sel { background:rgba(14,165,233,0.09);border-color:rgba(14,165,233,0.35);color:#0ea5e9; }

.gs-pill {
  display:inline-flex;align-items:center;gap:6px;
  background:rgba(14,165,233,0.07);border:1px solid rgba(14,165,233,0.18);
  border-radius:99px;padding:5px 14px;
}

.gs-copy-btn {
  display:inline-flex;align-items:center;gap:7px;padding:0 18px;height:44px;
  border-radius:11px;background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.22);
  cursor:pointer;font-size:13px;font-weight:700;color:#0ea5e9;transition:all .18s;white-space:nowrap;
}
.gs-copy-btn:hover { background:rgba(14,165,233,0.15);border-color:rgba(14,165,233,0.38); }

.gs-link-btn {
  background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.28);
  font-size:12px;font-weight:500;padding:8px 0;
  font-family:'Geist',-apple-system,sans-serif;
  transition:color .2s;
}
.gs-link-btn:hover { color:rgba(255,255,255,0.5); }

@media(max-width:768px) {
  .gs-two-col   { grid-template-columns:1fr !important; }
  .gs-three-col { grid-template-columns:1fr 1fr !important; }
  .gs-hide-sm   { display:none !important; }
  .gs-wide-pad  { padding:12px !important; }
  .gs-option    { padding:12px !important; }
  .gs-type-btn  { padding:10px 6px !important; font-size:11px !important; }
  .gs-card      { border-radius:16px !important; }
}
@media(min-width:769px) {
  .gs-show-sm   { display:none !important; }
}
`;

/* ─── Background wrapper ─────────────────────────────────────────────────── */
function BG({ children, maxWidth = 520, fullHeight = true }) {
  return (
    <div className="gs-root" style={{ minHeight: fullHeight ? '100vh' : 'auto', background: '#04080f', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%,black,transparent)' }} />
      <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,0.1) 0%,transparent 62%)', animation: 'gs-orb-a 24s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5%', right: '-8%', width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 62%)', animation: 'gs-orb-b 30s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.45) 30%,rgba(99,102,241,0.35) 70%,transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 3vw, 32px) clamp(12px, 4vw, 16px)' }}>
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
    <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <img src={POSE_1_URL} alt="CoStride" style={{ width: 48, height: 48, borderRadius: 13, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 6px 20px rgba(14,165,233,0.15)' }} />
      <div style={{ width: 200, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', borderRadius: 99, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Step {step} of {TOTAL}</span>
      <h1 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, color: '#e2eaff', letterSpacing: '-0.035em', lineHeight: 1.2, margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', maxWidth: 360, margin: 0, lineHeight: 1.7 }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const CHALLENGES = [
  { id: 'retention',  Icon: TrendingDown,     color: '#ef4444', title: 'Member Retention',  desc: 'Members are cancelling and revenue is suffering',           hint: 'CoStride identifies at-risk members before they cancel' },
  { id: 'attendance', Icon: UserX,            color: '#f59e0b', title: 'Low Attendance',    desc: 'Members join but rarely return after the first few weeks',  hint: 'Attendance trends reveal disengagement before members churn' },
  { id: 'engagement', Icon: MessageSquareOff, color: '#8b5cf6', title: 'Member Engagement', desc: 'Members train in isolation without a sense of belonging',    hint: 'Challenges and leaderboards build shared accountability' },
  { id: 'community',  Icon: Users,            color: '#0ea5e9', title: 'Building Community', desc: 'You want a culture that brings members back every week',    hint: 'Social feeds, events, and polls build community automatically' },
];

const MEMBER_COUNTS = ['Under 50', '50–150', '150–300', '300+'];

const GYM_TYPES = [
  { value: 'general',      label: 'General Fitness', Icon: Dumbbell   },
  { value: 'powerlifting', label: 'Powerlifting',    Icon: TrendingUp },
  { value: 'bodybuilding', label: 'Bodybuilding',    Icon: Target     },
  { value: 'crossfit',     label: 'CrossFit',        Icon: Zap        },
  { value: 'boxing',       label: 'Boxing',          Icon: Shield     },
  { value: 'mma',          label: 'MMA',             Icon: Activity   },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function GymSignup() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  /* ── State ──────────────────────────────────────────────────────────── */
  const [step,         setStep]         = useState(1);
  const [challenge,    setChallenge]    = useState(null);
  const [memberCount,  setMemberCount]  = useState(null);
  const [copied,       setCopied]       = useState(false);
  const [sharedInvite, setSharedInvite] = useState(false);
  const [createdGym,   setCreatedGym]   = useState(null);

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
        new window.QRCode(el, { text: `https://costride.app/join/${createdGym.join_code}`, width: 160, height: 160, colorDark: '#ffffff', colorLight: '#04080f', correctLevel: window.QRCode.CorrectLevel.H });
      }
    }, 300);
  }, [createdGym]);

  useEffect(() => {
    if (step !== 9 || !createdGym?.join_code) return;
    const existing = document.getElementById('qrcode-script');
    if (existing) { generateQR(); return; }
    const s = document.createElement('script');
    s.id = 'qrcode-script';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
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

  const applyPlace = (place) => setFormData(p => ({ ...p, name: place.name, google_place_id: place.place_id, latitude: place.latitude, longitude: place.longitude, address: place.address || '', city: place.city || '', postcode: place.postcode || '', photo_url: place.photo_url || null }));

  const claimGhost = () => {
    if (!ghostGym) return;
    setFormData(p => ({ ...p, name: ghostGym.name, google_place_id: ghostGym.google_place_id, latitude: ghostGym.latitude, longitude: ghostGym.longitude, address: ghostGym.address || '', city: ghostGym.city || '', postcode: ghostGym.postcode || '', type: ghostGym.type || 'general', amenities: ghostGym.amenities || [], equipment: ghostGym.equipment || [], specializes_in: ghostGym.specializes_in || [], claimingGymId: ghostGym.id }));
    setShowGhostModal(false);
    toast.success('Gym found. Complete setup to claim it.');
  };

  /* ── Email verification ─────────────────────────────────────────────── */
  const sendCode = async () => {
    if (!bizEmail) return;
    setSendingCode(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGenCode(code);
      await base44.integrations.Core.SendEmail({
        to: bizEmail,
        subject: 'Your CoStride Verification Code',
        body: `Hi,\n\nYour CoStride gym verification code is:\n\n${code}\n\nEnter this code to verify ownership of ${formData.name}.\n\nThis code expires in 10 minutes.\n\n— The CoStride Team`
      });
      setCodeSent(true);
      toast.success(`Code sent to ${bizEmail}`);
    } catch (e) { toast.error('Failed to send code. Please try again.'); } finally { setSendingCode(false); }
  };

  const verifyCode = async () => {
    setVerifyingCode(true);
    await new Promise(r => setTimeout(r, 600));
    if (enteredCode === genCode) { setEmailVerified(true); toast.success('Email verified. Your gym goes live immediately.'); }
    else toast.error('Incorrect code. Please try again.');
    setVerifyingCode(false);
  };

  /* ── Gym creation ───────────────────────────────────────────────────── */
  const detectLang = (city) => {
    const es = ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'];
    return es.some(c => city?.includes(c)) ? 'es' : 'en';
  };

  const createGymMutation = useMutation({
    mutationFn: async (data) => {
      // SECURITY: All gym creation and claiming is now handled server-side via the
      // addGym backend function. The backend controls:
      //   - status (always 'pending' unless admin — never client-controlled)
      //   - ownership fields (owner_email, admin_id set from authenticated user)
      //   - field allowlisting (no injecting banned_members, admin_id, etc.)
      //   - claim verification (caller must be unclaimed owner, not arbitrary user)
      const lang = detectLang(data.city);
      const result = await base44.functions.invoke('addGym', {
        gymData: {
          name:           data.name,
          google_place_id: data.google_place_id || '',
          latitude:       data.latitude,
          longitude:      data.longitude,
          address:        data.address        || '',
          city:           data.city           || '',
          postcode:       data.postcode       || '',
          type:           data.type           || 'general',
          language:       lang,
          description:    data.description    || '',
          amenities:      data.amenities      || [],
          equipment:      data.equipment      || [],
          specializes_in: data.specializes_in || [],
          ...(data.photo_url ? { photo_url: data.photo_url } : {}),
        },
        claimGymId: data.claimingGymId || null,
      });
      if (result.error) throw new Error(result.error);
      const gym = result.data?.gym;
      if (!gym) throw new Error('Gym creation failed');
      return gym;
    },
    onSuccess: async (gym) => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      // Mark onboarding complete so App.jsx doesn't redirect back to Onboarding
      try { await base44.auth.updateMe({ onboarding_completed: true }); } catch {}
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success(gym.status === 'pending' ? "Gym submitted — we'll review within 24 hours." : 'Gym registered and live.');
      setCreatedGym(gym);
      setStep(8);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to register gym. Please try again.');
    }
  });

  const submitGym = () => {
    if (!formData.name) { toast.error('Please select your gym first.'); setStep(4); return; }
    createGymMutation.mutate(formData);
  };

  const copyInviteLink = () => {
    const link = `https://costride.app/join/${createdGym?.join_code || ''}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setSharedInvite(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success('Link copied.');
    });
  };

  const shareInviteLink = async () => {
    const link = `https://costride.app/join/${createdGym?.join_code || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${createdGym?.name} on CoStride`, text: 'Join our gym community on CoStride', url: link });
        setSharedInvite(true);
      } catch {}
    } else {
      copyInviteLink();
    }
  };

  /* ──────────────────────────────────────────────────────────────────────
     SHARED BACKGROUND LAYER (reused across full-screen steps)
  ────────────────────────────────────────────────────────────────────── */
  const FullBG = ({ children }) => (
    <div className="gs-root" style={{ minHeight: '100vh', background: '#04080f', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 85% 55% at 50% 28%,black,transparent)', WebkitMaskImage: 'radial-gradient(ellipse 85% 55% at 50% 28%,black,transparent)' }} />
      <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(14,165,233,0.1) 0%,transparent 62%)', animation: 'gs-orb-a 24s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '5%', right: '-8%', width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 62%)', animation: 'gs-orb-b 30s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(14,165,233,0.45) 30%,rgba(99,102,241,0.35) 70%,transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════
     STEP 1 — AHA MOMENT
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 1) {
    return (
      <FullBG>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px) clamp(16px, 4vw, 32px)', textAlign: 'center' }}>
          {/* Logo */}
          <div className="gs-a1" style={{ marginBottom: 24 }}>
            <img src={LOGO_URL} alt="CoStride" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(14,165,233,0.2)' }} />
          </div>

          {/* Badge */}
          <div className="gs-a1 gs-pill" style={{ marginBottom: 24 }}>
            <div style={{ width: 5, height: 5, background: '#0ea5e9', borderRadius: '50%', animation: 'gs-pulse 2.5s ease-in-out infinite' }} />
            <span style={{ color: 'rgba(14,165,233,0.85)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Setup in under 2 minutes</span>
          </div>

          {/* Headline */}
          <h1 className="gs-a2" style={{ fontSize: 'clamp(28px,5vw,58px)', fontWeight: 900, color: '#e2eaff', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 16px', maxWidth: 760 }}>
            Turn Your Gym Into a Community<br />
            <span style={{ color: '#0ea5e9' }}>Members Don't Leave</span>
          </h1>

          <p className="gs-a3" style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: 'rgba(255,255,255,0.38)', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.8 }}>
            Members competing, connecting, and showing up consistently — all within your gym's branded experience.
          </p>

          {/* App Screenshot */}
          <div className="gs-a4" style={{ position: 'relative', width: '100%', maxWidth: 900, marginBottom: 44 }}>
            <div style={{ position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '5%', background: 'radial-gradient(ellipse at 50% 60%,rgba(14,165,233,0.14) 0%,rgba(99,102,241,0.08) 50%,transparent 72%)', filter: 'blur(48px)', pointerEvents: 'none', borderRadius: 80 }} />
            <div style={{ position: 'relative', zIndex: 1, animation: 'gs-float 7s ease-in-out infinite' }}>
              <img
                src={IMG_APP}
                alt="CoStride member app"
                style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 32px 80px rgba(14,165,233,0.18)) drop-shadow(0 12px 32px rgba(0,0,0,0.6))' }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="gs-a5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 380 }}>
            <button className="gs-btn-primary" style={{ fontSize: 15 }} onClick={() => setStep(2)}>
              <span style={{ position: 'relative', zIndex: 1 }}>Set this up for my gym</span>
              <ArrowRight style={{ width: 16, height: 16, position: 'relative', zIndex: 1 }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Free 14-day trial', 'No credit card', 'Cancel anytime'].map((t, i, arr) => (
                <React.Fragment key={t}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Check style={{ width: 10, height: 10, color: 'rgba(16,185,129,0.6)', strokeWidth: 2.5 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>{t}</span>
                  </div>
                  {i < arr.length - 1 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)' }}>·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </FullBG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 2 — PROBLEM / INSIGHT (TEXT ONLY)
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 2) {
    return (
      <FullBG>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 6vw, 48px) clamp(16px, 4vw, 24px)', textAlign: 'center' }}>
          <div className="gs-a1" style={{ marginBottom: 48 }}>
            <img src={POSE_1_URL} alt="CoStride" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>

          <div style={{ maxWidth: 600, marginBottom: 64 }}>
            <p className="gs-a2" style={{ fontSize: 'clamp(26px,4.5vw,44px)', fontWeight: 800, color: '#e2eaff', letterSpacing: '-0.04em', lineHeight: 1.15, margin: '0 0 6px' }}>
              Most members don't cancel.
            </p>
            <div style={{ width: 48, height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px auto', borderRadius: 99 }} />
            <p className="gs-a3" style={{ fontSize: 'clamp(26px,4.5vw,44px)', fontWeight: 800, color: 'rgba(255,255,255,0.32)', letterSpacing: '-0.04em', lineHeight: 1.15, margin: '0 0 6px' }}>
              They slowly stop showing up.
            </p>
            <div style={{ width: 48, height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px auto', borderRadius: 99 }} />
            <p className="gs-a4" style={{ fontSize: 'clamp(26px,4.5vw,44px)', fontWeight: 800, color: '#0ea5e9', letterSpacing: '-0.04em', lineHeight: 1.15, margin: 0 }}>
              What if you could see it coming?
            </p>
          </div>

          <div className="gs-a5" style={{ width: '100%', maxWidth: 340 }}>
            <button className="gs-btn-primary" style={{ fontSize: 15, marginBottom: 12 }} onClick={() => setStep(3)}>
              <span style={{ position: 'relative', zIndex: 1 }}>Show me how</span>
              <ArrowRight style={{ width: 15, height: 15, position: 'relative', zIndex: 1 }} />
            </button>
            <button className="gs-link-btn" style={{ display: 'block', width: '100%' }} onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </div>
      </FullBG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 3 — PERSONALISATION
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 3) {
    return (
      <BG maxWidth={520}>
        <StepHeader step={1} title="What is your biggest challenge?" subtitle="We will tailor your setup around what matters most" />
        <div className="gs-card gs-a2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {CHALLENGES.map((c) => {
              const Icon = c.Icon;
              return (
                <button key={c.id} className={`gs-option${challenge === c.id ? ' sel' : ''}`} onClick={() => setChallenge(c.id)}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.color}15`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon style={{ width: 15, height: 15, color: c.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: challenge === c.id ? '#e2eaff' : 'rgba(255,255,255,0.6)', marginBottom: 3 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                  {challenge === c.id && <CheckCircle2 style={{ width: 15, height: 15, color: '#0ea5e9', flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          {challenge && (
            <div style={{ padding: '11px 14px', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 9 }}>
              <Eye style={{ width: 12, height: 12, color: '#0ea5e9', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(14,165,233,0.75)', lineHeight: 1.5 }}>{CHALLENGES.find(c2 => c2.id === challenge)?.hint}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="gs-btn-back" onClick={() => setStep(2)}>Back</button>
            <button className="gs-btn-primary" disabled={!challenge} onClick={() => setStep(4)} style={{ flex: 1 }}>
              <span style={{ position: 'relative', zIndex: 1 }}>Continue</span>
              <ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} />
            </button>
          </div>
          <button className="gs-link-btn" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 10 }} onClick={() => setStep(4)}>
            Skip this question
          </button>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 4 — GYM SETUP
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 4) {
    return (
      <BG maxWidth={580}>
        <StepHeader step={2} title="Find your gym" subtitle="We will look up your location and set up your community" />
        <div className="gs-card gs-a2">
          <label className="gs-label">Gym name or address</label>
          <div style={{ position: 'relative', marginBottom: selectedPlace ? 10 : 20 }}>
            <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
            <input className="gs-input" value={searchInput}
              onChange={e => { setSearchInput(e.target.value); searchGyms(e.target.value); }}
              placeholder="Search gym name or address"
              style={{ paddingLeft: 40 }} />
            {searching && <Loader2 style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#0ea5e9', animation: 'spin 1s linear infinite' }} />}
          </div>

          {searchResults.length > 0 && (
            <div style={{ background: 'rgba(4,8,15,0.98)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, overflow: 'hidden', marginBottom: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}>
              {searchResults.slice(0, 7).map((p, i) => (
                <button key={i} onClick={() => handleSelectPlace(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <div style={{ width: 30, height: 30, background: 'rgba(14,165,233,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#0ea5e9' }} />
                  </div>
                  <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2eaff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.address}</div>
                  </div>
                  <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {selectedPlace && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.22)', borderRadius: 12, marginBottom: 20 }}>
              <Building2 style={{ width: 16, height: 16, color: '#0ea5e9', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPlace.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPlace.address}</div>
              </div>
              <CheckCircle2 style={{ width: 14, height: 14, color: '#0ea5e9', flexShrink: 0 }} />
            </div>
          )}

          <label className="gs-label" style={{ marginBottom: 10 }}>Gym type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 20 }} className="gs-three-col">
            {GYM_TYPES.map(t => {
              const Icon = t.Icon;
              return (
                <button key={t.value} className={`gs-type-btn${formData.type === t.value ? ' sel' : ''}`} onClick={() => setFormData(p => ({ ...p, type: t.value }))}>
                  <Icon style={{ width: 17, height: 17 }} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <label className="gs-label" style={{ marginBottom: 10 }}>Approximate member count</label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 24 }}>
            {MEMBER_COUNTS.map(c => (
              <button key={c} className={`gs-count-btn${memberCount === c ? ' sel' : ''}`} onClick={() => setMemberCount(c)}>{c}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="gs-btn-back" onClick={() => setStep(3)}>Back</button>
            <button className="gs-btn-primary" disabled={!selectedPlace} onClick={() => setStep(5)} style={{ flex: 1 }}>
              <span style={{ position: 'relative', zIndex: 1 }}>Continue</span>
              <ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} />
            </button>
          </div>
        </div>

        {showGhostModal && ghostGym && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ maxWidth: 380, width: '100%', background: 'linear-gradient(160deg,#0d1f3c,#08121e)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: 28, boxShadow: '0 32px 80px rgba(0,0,0,0.75)' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(245,158,11,0.12)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid rgba(245,158,11,0.22)' }}>
                <Star style={{ width: 22, height: 22, color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#e2eaff', marginBottom: 8, letterSpacing: '-0.02em' }}>Community already exists</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 22, lineHeight: 1.7 }}>
                Members have already built a community for <strong style={{ color: '#e2eaff' }}>{ghostGym.name}</strong> with <strong style={{ color: '#f59e0b' }}>{ghostGym.members_count || 0} members</strong>. Claim it to take ownership.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="gs-btn-back" style={{ flex: 1 }} onClick={() => setShowGhostModal(false)}>Cancel</button>
                <button className="gs-btn-primary" style={{ flex: 1, height: 44 }} onClick={claimGhost}>
                  <span style={{ position: 'relative', zIndex: 1 }}>Claim it</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 5 — PERSONALISED PREVIEW (SECOND AHA)
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 5) {
    const gymName = formData.name || 'Your Gym';
    const statCards = [
      { label: 'Members active this week', val: '12', color: '#0ea5e9', sub: 'up 4 from last week' },
      { label: 'Retention rate',           val: '94%', color: '#10b981', sub: 'industry avg is 72%' },
      { label: 'New members this month',   val: '+5', color: '#8b5cf6', sub: 'via community referral' },
    ];
    return (
      <FullBG>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px, 5vw, 40px) clamp(12px, 4vw, 24px)' }}>
          <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 60, alignItems: 'center' }} className="gs-two-col">
            {/* Left: copy */}
            <div>
              <div className="gs-a1" style={{ marginBottom: 14 }}>
                <img src={LOGO_URL} alt="CoStride" style={{ width: 42, height: 42, borderRadius: 11, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="gs-a1" style={{ marginBottom: 14 }}>
                <div style={{ width: 180, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Step 3 of 6</span>
              </div>
              <h1 className="gs-a2" style={{ fontSize: 'clamp(24px,3.8vw,42px)', fontWeight: 900, color: '#e2eaff', letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 14px' }}>
                Here is <span style={{ color: '#0ea5e9' }}>{gymName}</span><br />with CoStride.
              </h1>
              <p className="gs-a3" style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, margin: '0 0 28px' }}>
                Your members get a community app. You get a full dashboard to track who is engaged, who is at risk, and what is driving retention.
              </p>
              <div className="gs-a4" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
                {statCards.map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, minWidth: 48, letterSpacing: '-0.02em' }}>{s.val}</div>
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="gs-a5" style={{ display: 'flex', gap: 10 }}>
                <button className="gs-btn-back" onClick={() => setStep(4)}>Back</button>
                <button className="gs-btn-primary" style={{ flex: 1 }} onClick={() => setStep(6)}>
                  <span style={{ position: 'relative', zIndex: 1 }}>Start building this</span>
                  <ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} />
                </button>
              </div>
            </div>

            {/* Right: dashboard preview */}
            <div className="gs-a3 gs-hide-sm" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '5%', left: '5%', right: '5%', bottom: '5%', background: 'radial-gradient(ellipse at 50% 40%,rgba(14,165,233,0.15) 0%,rgba(99,102,241,0.08) 45%,transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1, animation: 'gs-float 7s ease-in-out infinite' }}>
                <img src={IMG_DASH2} alt="Dashboard preview" style={{ width: '100%', display: 'block', borderRadius: 10, filter: 'drop-shadow(0 24px 60px rgba(14,165,233,0.15))' }} />
                <div style={{ position: 'absolute', top: '7%', left: '-12%', background: 'rgba(4,8,15,0.95)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 13, padding: '10px 14px', boxShadow: '0 12px 36px rgba(0,0,0,0.5)', backdropFilter: 'blur(14px)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Active gym</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaff' }}>{gymName}</div>
                </div>
                <div style={{ position: 'absolute', bottom: '10%', right: '-10%', background: 'rgba(4,8,15,0.95)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 13, padding: '10px 14px', boxShadow: '0 12px 36px rgba(0,0,0,0.5)', backdropFilter: 'blur(14px)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>This week</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>12 members active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FullBG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 6 — DASHBOARD PREVIEW (LOGICAL AHA)
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 6) {
    const mockAtRisk = [
      { initials: 'SM', name: 'Sarah M.', lastSeen: '18 days ago', risk: 'High',   riskColor: '#ef4444', activity: 8 },
      { initials: 'JT', name: 'James T.', lastSeen: '12 days ago', risk: 'Medium', riskColor: '#f59e0b', activity: 35 },
      { initials: 'ER', name: 'Emma R.',  lastSeen: '9 days ago',  risk: 'Medium', riskColor: '#f59e0b', activity: 52 },
    ];
    const mockEngagement = [
      { label: 'Avg. sessions per week', value: '2.1', color: '#0ea5e9' },
      { label: 'Members at risk',        value: '3',   color: '#ef4444' },
      { label: 'Retention rate',         value: '94%', color: '#10b981' },
    ];
    return (
      <BG maxWidth={600}>
        <StepHeader step={3} title="See who is at risk — before they leave" subtitle="CoStride surfaces disengagement automatically. No manual tracking required." />
        <div className="gs-card gs-a2" style={{ padding: 0, overflow: 'hidden' }}>
          {/* At-risk section header */}
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: 13, height: 13, color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaff' }}>At-Risk Members</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>3 members showing signs of churn</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, padding: '3px 10px' }}>Action needed</div>
          </div>

          {/* At-risk rows */}
          <div style={{ padding: '8px 0' }}>
            {mockAtRisk.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderBottom: i < mockAtRisk.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${m.riskColor}18`, border: `1px solid ${m.riskColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: m.riskColor, flexShrink: 0 }}>
                  {m.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2eaff', marginBottom: 2 }}>{m.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 3, width: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${m.activity}%`, height: '100%', background: m.riskColor, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Last seen {m.lastSeen}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: m.riskColor, background: `${m.riskColor}12`, border: `1px solid ${m.riskColor}25`, borderRadius: 99, padding: '3px 10px', flexShrink: 0 }}>
                  {m.risk}
                </div>
              </div>
            ))}
          </div>

          {/* Engagement metrics */}
          <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {mockEngagement.map((m) => (
              <div key={m.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 11, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.color, letterSpacing: '-0.02em', marginBottom: 3 }}>{m.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 500, lineHeight: 1.4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '14px 22px 18px' }}>
            <div style={{ fontSize: 11, color: 'rgba(14,165,233,0.65)', textAlign: 'center', marginBottom: 14, lineHeight: 1.6 }}>
              CoStride calculates this automatically from check-in and app activity data.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="gs-btn-back" onClick={() => setStep(5)}>Back</button>
              <button className="gs-btn-primary" style={{ flex: 1 }} onClick={() => setStep(7)}>
                <span style={{ position: 'relative', zIndex: 1 }}>Continue</span>
                <ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} />
              </button>
            </div>
          </div>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 7 — VERIFY OWNERSHIP
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 7) {
    return (
      <BG maxWidth={520}>
        <StepHeader step={4} title="Verify ownership" subtitle={`Confirm you are the owner of ${formData.name || 'your gym'}`} />
        <div className="gs-card gs-a2">
          {/* Method toggle */}
          <div style={{ display: 'flex', gap: 5, padding: 4, background: 'rgba(0,0,0,0.2)', borderRadius: 13, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 22 }}>
            {[{ id: 'email', icon: Mail, label: 'Business Email' }, { id: 'instagram', icon: Instagram, label: 'Instagram' }].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => { setVerifyMethod(id); setCodeSent(false); setEmailVerified(false); setEnteredCode(''); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .2s',
                  background: verifyMethod === id ? (id === 'email' ? 'linear-gradient(135deg,#0ea5e9,#0369a1)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)') : 'transparent',
                  color: verifyMethod === id ? '#fff' : 'rgba(255,255,255,0.38)',
                  boxShadow: verifyMethod === id ? '0 3px 14px rgba(14,165,233,0.25)' : 'none'
                }}>
                <Icon style={{ width: 13, height: 13 }} /> {label}
              </button>
            ))}
          </div>

          {verifyMethod === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!emailVerified ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 14px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 12 }}>
                    <Lock style={{ width: 13, height: 13, color: '#0ea5e9', marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.7 }}>Enter your business email. We will send a 6-digit code — if you can receive it, you own it. Personal email addresses go to manual review.</p>
                  </div>
                  <div>
                    <label className="gs-label">Business email</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="gs-input" type="email" value={bizEmail} onChange={e => { setBizEmail(e.target.value); setCodeSent(false); setEnteredCode(''); }} placeholder="owner@yourgym.com" disabled={codeSent} style={{ flex: 1, opacity: codeSent ? .5 : 1 }} />
                      <button onClick={sendCode} disabled={!bizEmail || sendingCode || codeSent}
                        style={{ height: 48, padding: '0 15px', borderRadius: 11, background: 'linear-gradient(135deg,#0ea5e9,#0369a1)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 13, opacity: (!bizEmail || sendingCode || codeSent) ? .38 : 1, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {sendingCode ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : codeSent ? 'Sent' : 'Send Code'}
                      </button>
                    </div>
                  </div>
                  {codeSent && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 10 }}>
                        <CheckCircle2 style={{ width: 12, height: 12, color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'rgba(16,185,129,0.75)' }}>Code sent to <strong style={{ color: '#10b981' }}>{bizEmail}</strong></span>
                      </div>
                      <div>
                        <label className="gs-label">Verification code</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input className="gs-input" value={enteredCode} onChange={e => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: '0.35em', flex: 1 }} />
                          <button onClick={verifyCode} disabled={enteredCode.length !== 6 || verifyingCode}
                            style={{ height: 48, padding: '0 16px', borderRadius: 11, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 13, opacity: (enteredCode.length !== 6 || verifyingCode) ? .38 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {verifyingCode ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : 'Verify'}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => { setCodeSent(false); setEnteredCode(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                        Wrong email address
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 13 }}>
                  <div style={{ width: 42, height: 42, background: 'rgba(16,185,129,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#e2eaff', fontSize: 14 }}>Email verified</div>
                    <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>{bizEmail}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Your gym goes live immediately after setup.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {verifyMethod === 'instagram' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12 }}>
                <Instagram style={{ width: 13, height: 13, color: '#8b5cf6', marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.7 }}>Send a DM from your gym's Instagram with your unique code below. We will verify within 24 hours.</p>
              </div>
              <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 13, padding: 18, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>Your unique code</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#e2eaff', letterSpacing: '.3em', marginBottom: 8 }}>{igCode}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>DM this to <span style={{ color: '#8b5cf6', fontWeight: 700 }}>@CoStrideApp</span></div>
              </div>
              <div>
                <label className="gs-label">Your gym's Instagram handle</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontWeight: 700, fontSize: 14 }}>@</span>
                  <input className="gs-input" value={igHandle} onChange={e => setIgHandle(e.target.value)} placeholder="yourgymhandle" style={{ paddingLeft: 28 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10 }}>
                <Clock style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'rgba(245,158,11,0.7)' }}>We will approve your gym within 24 hours of receiving your DM.</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="gs-btn-back" onClick={() => setStep(6)}>Back</button>
            <button className="gs-btn-primary" style={{ flex: 1 }} disabled={createGymMutation.isPending || (verifyMethod === 'email' && !bizEmail)} onClick={submitGym}>
              {createGymMutation.isPending
                ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite', position: 'relative', zIndex: 1 }} /><span style={{ position: 'relative', zIndex: 1 }}>Creating your gym</span></>
                : <><span style={{ position: 'relative', zIndex: 1 }}>Launch my gym</span><ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} /></>}
            </button>
          </div>
          {verifyMethod === 'email' && !bizEmail && (
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
              Enter your business email above to continue
            </div>
          )}
          {(verifyMethod === 'instagram' || bizEmail) && (
            <button onClick={submitGym} disabled={createGymMutation.isPending} className="gs-link-btn" style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 10 }}>
              Skip verification — we will review within 24 hours
            </button>
          )}
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 8 — INVITE MEMBERS (ACTIVATION)
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 8) {
    const inviteLink = `costride.app/join/${createdGym?.join_code || '------'}`;
    const isPending  = createdGym?.status === 'pending';
    return (
      <BG maxWidth={520}>
        <StepHeader step={5} title="Invite your first members" subtitle="Your community starts when your members join. This is the most important step." />
        <div className="gs-card gs-a2">
          {isPending ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, marginBottom: 20 }}>
              <Clock style={{ width: 13, height: 13, color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>Under review</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>We will verify ownership within 24 hours. Your invite link works now — share it while you wait.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 12, marginBottom: 20 }}>
              <CheckCircle2 style={{ width: 13, height: 13, color: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'rgba(16,185,129,0.8)', fontWeight: 500 }}><strong style={{ color: '#e2eaff' }}>{createdGym?.name}</strong> is live on CoStride</span>
            </div>
          )}

          <label className="gs-label">Invite link</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 13px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11, overflow: 'hidden', minWidth: 0 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inviteLink}</span>
            </div>
            <button className="gs-copy-btn" onClick={copyInviteLink}>
              {copied ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Share button */}
          <button onClick={shareInviteLink} style={{ width: '100%', height: 44, borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', transition: 'all .2s', marginBottom: 20, fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
            <Share2 style={{ width: 14, height: 14 }} />
            Share invite link
          </button>

          {/* Join code display */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 13, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 6 }}>Or share the join code</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#e2eaff', letterSpacing: '.3em' }}>{createdGym?.join_code || '------'}</div>
          </div>

          {sharedInvite ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, marginBottom: 20 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2eaff', marginBottom: 1 }}>Link shared. Your community is growing.</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Share it in your gym group chats, email, and on your notice board.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)', borderRadius: 11, marginBottom: 20 }}>
              <Users style={{ width: 12, height: 12, color: '#0ea5e9', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(14,165,233,0.65)' }}>Members who join via link are <strong style={{ color: '#0ea5e9' }}>3x more likely</strong> to remain active in their first month.</span>
            </div>
          )}

          <button className="gs-btn-primary" style={{ marginBottom: 10 }} onClick={() => setStep(9)}>
            <span style={{ position: 'relative', zIndex: 1 }}>Continue to dashboard</span>
            <ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} />
          </button>
          <button className="gs-link-btn" style={{ display: 'block', width: '100%', textAlign: 'center' }} onClick={() => setStep(9)}>
            Skip for now
          </button>
        </div>
      </BG>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════
     STEP 9 — FEEDBACK STATE + DASHBOARD ENTRY
  ══════════════════════════════════════════════════════════════════════ */
  if (step === 9) {
    const isPending = createdGym?.status === 'pending';
    const placeholderCards = [
      { label: 'Leaderboard', sub: 'Rankings appear as members log workouts', Icon: Trophy, color: '#f59e0b' },
      { label: 'Community Feed', sub: 'Posts and activity appear as members join', Icon: Users, color: '#0ea5e9' },
      { label: 'Active Challenges', sub: 'Create your first challenge to get started', Icon: Zap, color: '#8b5cf6' },
    ];
    return (
      <BG maxWidth={480}>
        {/* Completion header */}
        <div className="gs-a1" style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', animation: 'gs-glow 3.5s ease-in-out infinite',
            borderColor: isPending ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
            background: isPending ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}>
            {isPending
              ? <Clock style={{ width: 30, height: 30, color: '#f59e0b' }} />
              : <CheckCircle2 style={{ width: 30, height: 30, color: '#10b981' }} />}
          </div>
          <h1 style={{ fontSize: 'clamp(26px,5vw,38px)', fontWeight: 900, color: '#e2eaff', letterSpacing: '-0.04em', margin: 0 }}>
            {sharedInvite ? 'Your community is live.' : isPending ? 'Under Review' : 'Setup Complete'}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', maxWidth: 340, margin: 0, lineHeight: 1.7 }}>
            {sharedInvite
              ? `Members can join ${createdGym?.name} right now using your invite link.`
              : isPending
                ? `We will review ${createdGym?.name} within 24 hours. Invite members while you wait.`
                : `${createdGym?.name} is registered. Invite members to activate your community.`}
          </p>
        </div>

        <div className="gs-card gs-a2">
          {/* QR Code */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, marginBottom: 14 }}>Member join code</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ background: '#04080f', padding: 14, borderRadius: 16, border: '1px solid rgba(14,165,233,0.12)', boxShadow: '0 12px 40px rgba(0,0,0,0.55)' }}>
                <div id="qr-container" style={{ width: 160, height: 160 }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#e2eaff', letterSpacing: '.3em', marginBottom: 4 }}>{createdGym?.join_code}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>costride.app/join/{createdGym?.join_code}</div>
          </div>

          {/* Dashboard placeholder preview */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18, marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 700, marginBottom: 12 }}>Your dashboard</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {placeholderCards.map(card => {
                const Icon = card.Icon;
                return (
                  <div key={card.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 11 }}>
                    <div style={{ width: 30, height: 30, background: `${card.color}12`, border: `1px solid ${card.color}22`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 13, height: 13, color: card.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{card.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{card.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="gs-btn-primary" onClick={() => navigate(createdGym?.status === 'approved' ? createPageUrl('GymOwnerDashboard') : createPageUrl('GymUnderReview'))}>
            <span style={{ position: 'relative', zIndex: 1 }}>{createdGym?.status === 'approved' ? 'Go to Dashboard' : 'View Status'}</span>
            <ArrowRight style={{ width: 14, height: 14, position: 'relative', zIndex: 1 }} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.18)', fontWeight: 500 }}>
          We will email you a printable poster with your QR code
        </div>
      </BG>
    );
  }

  return null;
}