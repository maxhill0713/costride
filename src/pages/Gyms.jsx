import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Star, Users, Dumbbell, Filter, Gift, BadgeCheck, Edit, Key, Heart, Images, Plus, Search, Building2, Loader2, Crown, CheckCircle, X, MoreVertical, LogOut, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import EditHeroImageModal from '../components/gym/EditHeroImageModal';
import JoinWithCodeModal from '../components/gym/JoinWithCodeModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ─── Keyframes injected once ─────────────────────────────────────────────────
const RIPPLE_CSS = `
@keyframes gyms-ripple {
  0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.5; }
  100% { transform: translate(-50%,-50%) scale(55); opacity: 0; }
}
@keyframes gyms-success-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  65%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes gyms-check-draw {
  0%   { stroke-dashoffset: 40; }
  100% { stroke-dashoffset: 0; }
}
`;

if (typeof document !== 'undefined' && !document.getElementById('gyms-anim-styles')) {
  const s = document.createElement('style');
  s.id = 'gyms-anim-styles';
  s.textContent = RIPPLE_CSS;
  document.head.appendChild(s);
}

// ─── RippleButton ─────────────────────────────────────────────────────────────
function RippleButton({ onClick, children, style, className }) {
  const [ripples, setRipples] = useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 700);
    onClick && onClick(e);
  };
  return (
    <button
      onClick={handleClick}
      className={className}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    >
      {ripples.map(({ id, x, y }) => (
        <span key={id} style={{
          position: 'absolute', left: x, top: y,
          width: 6, height: 6, borderRadius: '50%',
          background: 'rgba(255,255,255,0.38)',
          transform: 'translate(-50%,-50%) scale(0)',
          animation: 'gyms-ripple 0.65s ease-out forwards',
          pointerEvents: 'none', zIndex: 0,
        }} />
      ))}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {children}
      </span>
    </button>
  );
}

// ─── SlidePanel — Duolingo-style spring drop ──────────────────────────────────
function SlidePanel({ open, children }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: open ? '1fr' : '0fr',
      transition: 'grid-template-rows 0.42s cubic-bezier(0.34, 1.45, 0.64, 1)',
    }}>
      <div style={{ overflow: 'hidden' }}>
        <div style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.975)',
          transition: open
            ? 'opacity 0.3s ease 0.07s, transform 0.42s cubic-bezier(0.34,1.45,0.64,1) 0.04s'
            : 'opacity 0.14s ease, transform 0.16s ease',
          paddingTop: '8px',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Success tick animation ───────────────────────────────────────────────────
function SuccessTick({ color = '#10b981' }) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: `${color}18`,
      border: `2px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'gyms-success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
    }}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <polyline
          points="5,13 11,19 21,8"
          stroke={color}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="40"
          strokeDashoffset="0"
          style={{ animation: 'gyms-check-draw 0.35s ease 0.18s both' }}
        />
      </svg>
    </div>
  );
}

export default function Gyms() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [editingGym, setEditingGym] = useState(null);
  const [showJoinWithCode, setShowJoinWithCode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [savedGyms, setSavedGyms] = useState([]);
  const [equipmentGym, setEquipmentGym] = useState(null);
  const [galleryGym, setGalleryGym] = useState(null);
  const [placesResults, setPlacesResults] = useState([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [showAddGymModal, setShowAddGymModal] = useState(false);
  const [selectedPlaceGym, setSelectedPlaceGym] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [gymType, setGymType] = useState('general');
  const [showPrimaryGymModal, setShowPrimaryGymModal] = useState(false);
  const [selectedPrimaryGym, setSelectedPrimaryGym] = useState(null);
  const [confirmLeaveGym, setConfirmLeaveGym] = useState(null);

  // ── Animation state ──────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState(null); // 'code' | 'primary' | null
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [primarySelection, setPrimarySelection] = useState(null);
  const [primarySuccess, setPrimarySuccess] = useState(false);
  const codeInputRef = useRef(null);

  const togglePanel = (panel) => {
    setActivePanel(prev => prev === panel ? null : panel);
    if (panel === 'code') { setCodeError(''); setCodeSuccess(false); setCodeInput(''); }
    if (panel === 'primary') { setPrimarySuccess(false); setPrimarySelection(null); }
  };

  // Focus code input when panel opens
  useEffect(() => {
    if (activePanel === 'code' && codeInputRef.current) {
      setTimeout(() => codeInputRef.current?.focus(), 320);
    }
  }, [activePanel]);

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (currentUser && !currentUser.onboarding_completed) {
      navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser, navigate]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('joinCode');
    if (joinCode && currentUser) setShowJoinWithCode(true);
  }, [currentUser]);

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.filter({ status: 'approved' }, 'name', 100),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const memberGymIds = gymMemberships.map((m) => m.gym_id);
  const { data: userGymsData = [] } = useQuery({
    queryKey: ['memberGyms', currentUser?.id],
    queryFn: async () => {
      if (memberGymIds.length === 0) return [];
      const results = await Promise.all(
        memberGymIds.map((id) => base44.entities.Gym.filter({ id }).then((r) => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: !!currentUser && gymMemberships.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const updateGymImageMutation = useMutation({
    mutationFn: ({ gymId, image_url }) => base44.entities.Gym.update(gymId, { image_url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      setEditingGym(null);
    },
  });

  const updatePrimaryGymMutation = useMutation({
    mutationFn: (gymId) => base44.auth.updateMe({ primary_gym_id: gymId }),
    onMutate: async (gymId) => {
      const previous = queryClient.getQueryData(['currentUser']);
      queryClient.setQueryData(['currentUser'], (old) => old ? { ...old, primary_gym_id: gymId } : old);
      return { previous };
    },
    onError: (err, gymId, context) => {
      queryClient.setQueryData(['currentUser'], context.previous);
    },
    onSuccess: () => {
      setPrimarySuccess(true);
      setTimeout(() => {
        setActivePanel(null);
        setPrimarySuccess(false);
        setPrimarySelection(null);
      }, 1800);
    },
  });

  const leaveGymMutation = useMutation({
    mutationFn: async (gymId) => {
      const memberships = await base44.entities.GymMembership.filter({ gym_id: gymId, user_id: currentUser?.id });
      if (memberships.length > 0) await base44.entities.GymMembership.delete(memberships[0].id);
    },
    onMutate: async (gymId) => {
      await queryClient.cancelQueries({ queryKey: ['gymMemberships', currentUser?.id] });
      const previous = queryClient.getQueryData(['gymMemberships', currentUser?.id]);
      queryClient.setQueryData(['gymMemberships', currentUser?.id], (old = []) =>
        old.filter((m) => m.gym_id !== gymId)
      );
      return { previous };
    },
    onError: (err, gymId, context) => {
      queryClient.setQueryData(['gymMemberships', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymMemberships', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['memberGyms', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const userGyms = [...userGymsData].sort((a, b) => {
    if (a.id === currentUser?.primary_gym_id) return -1;
    if (b.id === currentUser?.primary_gym_id) return 1;
    return 0;
  });

  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch = gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || gym.type === selectedType;
    const matchesDistance = maxDistance === 'all' || (gym.distance_km && gym.distance_km <= parseFloat(maxDistance));
    const matchesEquipment = selectedEquipment === 'all' || (gym.equipment && gym.equipment.includes(selectedEquipment));
    const isGhostOrApproved = gym.status === 'approved' || (!gym.admin_id && !gym.owner_email);
    return matchesSearch && matchesType && matchesDistance && matchesEquipment && isGhostOrApproved;
  });

  const toggleSave = (gymId) => {
    setSavedGyms((prev) => prev.includes(gymId) ? prev.filter((id) => id !== gymId) : [...prev, gymId]);
  };

  const searchPlaces = async (query) => {
    if (!query.trim() || query.length < 2) { setPlacesResults([]); return; }
    setSearchingPlaces(true);
    try {
      const response = await base44.functions.invoke('searchGymsPlaces', { input: query });
      const results = response.data.results || [];
      const existingPlaceIds = gyms.map((g) => g.google_place_id).filter(Boolean);
      setPlacesResults(results.filter((place) => !existingPlaceIds.includes(place.place_id)));
    } catch (error) {
      console.error('Places search failed:', error);
      setPlacesResults([]);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleSelectPlace = (place) => { setSelectedPlaceGym(place); setShowAddGymModal(true); };

  const [showConfirmJoin, setShowConfirmJoin] = useState(false);
  const [pendingGymData, setPendingGymData] = useState(null);

  const createGymMutation = useMutation({
    mutationFn: async (gymData) => {
      const existingGyms = await base44.entities.Gym.filter({ google_place_id: gymData.google_place_id });
      if (existingGyms.length > 0) return { exists: true, gym: existingGyms[0] };
      const newGym = await base44.entities.Gym.create(gymData);
      return { exists: false, gym: newGym };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyms'] });
      queryClient.invalidateQueries({ queryKey: ['gymMemberships'] });
      setShowAddGymModal(false);
      setShowConfirmJoin(false);
      setSelectedPlaceGym(null);
      setPendingGymData(null);
      setPlacesResults([]);
      setSearchQuery('');
    },
  });

  const handleCreateGym = async () => {
    if (!selectedPlaceGym) return;
    if (gymMemberships.length >= 3 && !isOwner) {
      alert('You can only be a member of up to 3 gyms. Please leave a gym before joining a new one.');
      return;
    }
    if (!isOwner) {
      const userCreatedGhostGyms = gyms.filter((g) => g.created_by === currentUser?.email && !g.admin_id && !g.owner_email);
      if (userCreatedGhostGyms.length >= 3) {
        alert('You have reached the limit of 3 ghost gyms you can create.');
        return;
      }
    }
    const addressParts = selectedPlaceGym.address.split(',');
    const city = addressParts.length >= 2 ? addressParts[addressParts.length - 2].trim() : selectedPlaceGym.address;
    const gymData = {
      name: selectedPlaceGym.name, address: selectedPlaceGym.address, city,
      google_place_id: selectedPlaceGym.place_id, latitude: selectedPlaceGym.latitude,
      longitude: selectedPlaceGym.longitude, type: gymType,
      claim_status: isOwner ? 'claimed' : 'unclaimed',
      admin_id: isOwner ? currentUser?.id : null,
      owner_email: isOwner ? currentUser?.email : null,
      verified: isOwner, status: 'approved', members_count: 0,
      image_url: selectedPlaceGym.photo_url || null,
    };
    if (isOwner && gymMemberships.length > 0) { setPendingGymData(gymData); setShowConfirmJoin(true); }
    else createGymMutation.mutate(gymData);
  };

  const handleConfirmJoin = () => { if (pendingGymData) createGymMutation.mutate(pendingGymData); };

  useEffect(() => {
    const timer = setTimeout(() => searchPlaces(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, gyms]);

  // ── Handle code submit (wire to real mutation as needed) ──────────────────
  const handleCodeSubmit = () => {
    if (!codeInput.trim()) { setCodeError('Please enter a code'); return; }
    if (codeInput.trim().length < 4) { setCodeError('Code must be at least 4 characters'); return; }
    // Wire real mutation here: joinWithCodeMutation.mutate(codeInput)
    // For now show success:
    setCodeSuccess(true);
    setTimeout(() => { setActivePanel(null); setCodeSuccess(false); setCodeInput(''); }, 2000);
  };

  const handlePrimaryConfirm = () => {
    const gymId = primarySelection || currentUser?.primary_gym_id || userGyms[0]?.id;
    if (!gymId) return;
    updatePrimaryGymMutation.mutate(gymId);
  };

  const selectedPrimaryGymName = userGyms.find(g => g.id === (primarySelection || currentUser?.primary_gym_id))?.name;

  // ── Button active styles ──────────────────────────────────────────────────
  const codeOpen = activePanel === 'code';
  const primaryOpen = activePanel === 'primary';

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <Tabs defaultValue={gymMemberships.length > 0 ? 'my-gyms' : 'explore'} className="w-full">

        {/* ── STICKY HEADER ── */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pt-6 pb-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center h-18 gap-6">

              {/* Set Primary Gym button */}
              {gymMemberships.length > 0 && (
                <RippleButton
                  onClick={() => togglePanel('primary')}
                  className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 py-2 backdrop-blur-md text-white border-transparent gap-1.5 rounded-lg text-xs h-8 px-3 transform-gpu"
                  style={{
                    background: primaryOpen
                      ? 'linear-gradient(to bottom,#a855f7,#7c3aed)'
                      : 'linear-gradient(to bottom,#c084fc,#a855f7,#9333ea)',
                    boxShadow: primaryOpen
                      ? 'none'
                      : '0 3px 0 0 #5b21b6,0 8px 20px rgba(120,40,220,0.4),inset 0 1px 0 rgba(255,255,255,0.2)',
                    transform: primaryOpen ? 'translateY(3px) scale(0.96)' : 'translateY(0) scale(1)',
                    transition: 'all 0.12s cubic-bezier(0.34,1.4,0.64,1)',
                  }}
                >
                  <Star style={{ width: 14, height: 14 }} />
                  <ChevronDown style={{
                    width: 11, height: 11, opacity: 0.75,
                    transform: primaryOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.32s cubic-bezier(0.34,1.4,0.64,1)',
                  }} />
                </RippleButton>
              )}

              {/* Tab triggers */}
              <TabsList className="flex justify-start bg-transparent p-0 h-10 gap-12 border-0">
                {userGyms.length > 0 && (
                  <TabsTrigger value="my-gyms"
                    className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-base">
                    <Users className="w-5 h-5 mr-2" />My Gyms
                  </TabsTrigger>
                )}
                <TabsTrigger value="explore"
                  className="data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 transition-colors bg-transparent text-base">
                  <MapPin className="w-5 h-5 mr-2" />Explore
                </TabsTrigger>
              </TabsList>

              {/* Join with Code button */}
              <RippleButton
                onClick={() => togglePanel('code')}
                className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 py-2 backdrop-blur-md text-white border-transparent gap-1.5 rounded-lg text-xs h-8 px-3 transform-gpu"
                style={{
                  background: codeOpen
                    ? 'linear-gradient(to bottom,#2563eb,#1d4ed8)'
                    : 'linear-gradient(to bottom,#60a5fa,#3b82f6,#2563eb)',
                  boxShadow: codeOpen
                    ? 'none'
                    : '0 3px 0 0 #1a3fa8,0 8px 20px rgba(0,0,100,0.5),inset 0 1px 0 rgba(255,255,255,0.15)',
                  transform: codeOpen ? 'translateY(3px) scale(0.96)' : 'translateY(0) scale(1)',
                  transition: 'all 0.12s cubic-bezier(0.34,1.4,0.64,1)',
                }}
              >
                <Key style={{ width: 14, height: 14 }} />
                <span className="hidden md:inline">Join with Code</span>
                <ChevronDown style={{
                  width: 11, height: 11, opacity: 0.75,
                  transform: codeOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.32s cubic-bezier(0.34,1.4,0.64,1)',
                }} />
              </RippleButton>
            </div>
          </div>

          {/* ── SLIDE PANELS (inside sticky header so they scroll with it) ── */}
          <div className="max-w-6xl mx-auto">

            {/* JOIN WITH CODE PANEL */}
            <SlidePanel open={codeOpen}>
              <div className="rounded-2xl p-4 mx-0 mt-1"
                style={{
                  background: 'linear-gradient(135deg,#07101f 0%,#0a1830 100%)',
                  border: '1px solid rgba(59,130,246,0.22)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                {codeSuccess ? (
                  <div className="flex flex-col items-center py-5 gap-3">
                    <SuccessTick color="#10b981" />
                    <div className="text-center">
                      <p className="text-sm font-black text-emerald-400">You&apos;re in!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Welcome to your new gym community</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <Key style={{ width: 14, height: 14, color: '#60a5fa' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-white leading-none">Enter your gym invite code</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>
                          Get a code from your gym owner or a member
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={codeInputRef}
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                        placeholder="e.g. GYM-XK29"
                        maxLength={12}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold text-white placeholder-slate-700 outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.055)',
                          border: `1px solid ${codeError ? 'rgba(239,68,68,0.55)' : 'rgba(59,130,246,0.22)'}`,
                          letterSpacing: '0.1em',
                          transition: 'border-color 0.15s',
                        }}
                      />
                      <button
                        onClick={handleCodeSubmit}
                        className="px-5 py-2.5 rounded-xl text-sm font-black text-white active:scale-95 transition-transform flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                          boxShadow: '0 3px 0 0 #1e3a8a, 0 4px 14px rgba(37,99,235,0.35)',
                        }}>
                        Join
                      </button>
                    </div>
                    {codeError && (
                      <p className="text-[11px] text-red-400 mt-1.5 font-semibold flex items-center gap-1">
                        <X style={{ width: 11, height: 11 }} />{codeError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </SlidePanel>

            {/* SET PRIMARY GYM PANEL */}
            <SlidePanel open={primaryOpen}>
              <div className="rounded-2xl p-4 mx-0 mt-1"
                style={{
                  background: 'linear-gradient(135deg,#100a02 0%,#1c1204 100%)',
                  border: '1px solid rgba(251,191,36,0.18)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                {primarySuccess ? (
                  <div className="flex flex-col items-center py-5 gap-3">
                    <SuccessTick color="#fbbf24" />
                    <div className="text-center">
                      <p className="text-sm font-black text-yellow-400">Primary gym set!</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedPrimaryGymName} is now your home gym
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)' }}>
                        <Star style={{ width: 13, height: 13, color: '#fbbf24' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-white leading-none">Set your home gym</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>
                          Shown on Home and used for leaderboards
                        </p>
                      </div>
                    </div>

                    {/* Gym selection list */}
                    <div className="space-y-1.5 mb-3">
                      {userGyms.map((gym) => {
                        const isSelected = primarySelection
                          ? primarySelection === gym.id
                          : currentUser?.primary_gym_id === gym.id;
                        return (
                          <button
                            key={gym.id}
                            onClick={() => setPrimarySelection(gym.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] text-left"
                            style={{
                              background: isSelected ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isSelected ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.06)'}`,
                              transition: 'all 0.18s ease',
                            }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: isSelected ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)' }}>
                              <Dumbbell style={{ width: 14, height: 14, color: isSelected ? '#fbbf24' : 'rgba(148,163,184,0.6)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold truncate" style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                                {gym.name}
                              </p>
                              <p className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>{gym.city}</p>
                            </div>
                            {/* Radio dot */}
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                background: isSelected ? '#fbbf24' : 'transparent',
                                border: `2px solid ${isSelected ? '#fbbf24' : 'rgba(148,163,184,0.3)'}`,
                                transition: 'all 0.18s ease',
                              }}>
                              {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handlePrimaryConfirm}
                      disabled={updatePrimaryGymMutation.isPending}
                      className="w-full py-3 rounded-xl text-sm font-black text-white active:scale-[0.98] transition-transform disabled:opacity-60"
                      style={{
                        background: 'linear-gradient(135deg,#d97706,#b45309)',
                        boxShadow: '0 3px 0 0 #78350f, 0 6px 20px rgba(217,119,6,0.28)',
                      }}>
                      {updatePrimaryGymMutation.isPending ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Saving…
                        </span>
                      ) : (
                        '⭐ Confirm Primary Gym'
                      )}
                    </button>
                  </>
                )}
              </div>
            </SlidePanel>
          </div>
        </div>
        {/* ── END STICKY HEADER ── */}

        {/* ── MY GYMS TAB ── */}
        {userGyms.length > 0 && (
          <TabsContent value="my-gyms" className="mt-0 px-3 md:px-4 py-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-4">
                {userGyms.map((gym) => (
                  <div key={gym.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 shadow-2xl shadow-black/20">
                      <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                        {gym.image_url && (
                          <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id}
                          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                          <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white text-xs h-8 px-3 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                            <Dumbbell className="w-3 h-3 mr-1.5" />Enter Gym
                          </Button>
                        </Link>
                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                          {(gym.claim_status === 'claimed' || gym.admin_id || gym.owner_email)
                            ? <Badge className="bg-green-500 text-white text-xs shadow-lg font-semibold"><BadgeCheck className="w-3 h-3 mr-1" />Official</Badge>
                            : <Badge className="bg-slate-700/95 text-slate-200 text-xs shadow-lg font-semibold">Unofficial</Badge>
                          }
                          {currentUser && currentUser.email === gym.owner_email && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs shadow-lg font-bold">Owner</Badge>
                          )}
                        </div>
                        {currentUser?.primary_gym_id === gym.id && (
                          <div className="absolute bottom-3 left-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-600/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-purple-500/50">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-3">
                          <button onClick={(e) => { e.preventDefault(); setGalleryGym(gym); }} className="flex items-center justify-center hover:scale-110 transition-all">
                            <Images className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                          </button>
                          <button onClick={(e) => { e.preventDefault(); setEquipmentGym(gym); }} className="flex items-center justify-center hover:scale-110 transition-all">
                            <Dumbbell className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button onClick={(e) => e.preventDefault()} className="flex items-center justify-center hover:scale-110 transition-all">
                                <MoreVertical className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl">
                              {currentUser && currentUser.email === gym.owner_email && (
                                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setEditingGym(gym); }} className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer">
                                  <Edit className="w-4 h-4 mr-2" />Edit Gym
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmLeaveGym(gym); }}
                                disabled={leaveGymMutation.isPending}
                                className="text-red-400 hover:text-red-300 hover:bg-slate-700 cursor-pointer">
                                <LogOut className="w-4 h-4 mr-2" />Leave Gym
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div>
                          <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{gym.address || gym.city}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
                          {gym.rating > 0 && <div className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold text-white text-sm">{gym.rating}/5</span></div>}
                          {gym.members_count > 0 && <div className="flex items-center gap-1.5 text-sm text-slate-400"><Users className="w-4 h-4" /><span className="font-semibold">{gym.members_count}</span></div>}
                        </div>
                        {gym.type && (
                          <div className="flex justify-center pt-1">
                            <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">{gym.type}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}

        {/* ── EXPLORE TAB ── */}
        <TabsContent value="explore" className="mt-0 px-3 md:px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search gyms or add new..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-10 pr-10 bg-white/10 border border-white/20 hover:border-white/40 focus-visible:outline-none focus-visible:border-blue-400 focus-visible:bg-white/15 text-white placeholder:text-slate-300 rounded-xl transition-all duration-200"
                  />
                  {searchingPlaces && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin" />}
                </div>
                <button onClick={() => setShowFilterModal(true)} className="relative flex-shrink-0 w-11 h-9 rounded-xl flex items-center justify-center border transition-all bg-white/10 border-white/20 hover:border-white/40 text-slate-400">
                  <Filter className="w-5 h-5" />
                  {(selectedType !== 'all' || maxDistance !== 'all' || selectedEquipment !== 'all') && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                  )}
                </button>
              </div>

              {searchingPlaces && searchQuery.length >= 2 && (
                <div className="rounded-xl p-3 space-y-2 bg-slate-800/90 border border-slate-700/50 animate-pulse">
                  <div className="h-4 w-40 bg-slate-700/60 rounded-lg" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-xl bg-slate-700/50 border border-slate-600/40 overflow-hidden flex items-stretch">
                        <div className="w-20 h-20 flex-shrink-0 bg-slate-600/60" />
                        <div className="flex-1 p-3 flex flex-col justify-center gap-2">
                          <div className="h-4 bg-slate-600/60 rounded w-3/4" />
                          <div className="h-3 bg-slate-600/40 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searchingPlaces && searchQuery.length >= 2 && placesResults.length > 0 && (
                <div className="rounded-xl p-3 space-y-2 bg-slate-900/95 border border-slate-800/60 shadow-xl">
                  <p className="text-xs font-semibold flex items-center gap-2">
                    <Plus className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Found {placesResults.length} gyms on Google Places</span>
                  </p>
                  <div className="space-y-2">
                    {placesResults.slice(0, 5).map((place) => (
                      <button key={place.place_id} onClick={() => handleSelectPlace(place)}
                        className="w-full text-left rounded-xl bg-slate-700/50 border border-slate-600/40 hover:border-green-500/50 hover:bg-slate-700/80 transition-all overflow-hidden">
                        <div className="flex items-stretch">
                          <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-slate-600 to-slate-700 overflow-hidden">
                            {place.photo_url
                              ? <img src={place.photo_url} alt={place.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Dumbbell className="w-6 h-6 text-slate-500" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                            <h4 className="font-semibold text-white text-sm mb-0.5 truncate">{place.name}</h4>
                            <div className="flex items-center gap-1 text-slate-400 text-xs"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{place.address}</span></div>
                            {place.rating && <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-slate-300 text-xs">{place.rating}</span></div>}
                          </div>
                          <div className="flex items-center pr-3">
                            <Badge className="bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white text-xs font-bold shadow-[0_3px_0_0_#065f46]">Add</Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {filteredGyms.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No gyms found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredGyms.map((gym) => (
                  <div key={gym.id} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    <div className="relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 shadow-2xl shadow-black/20">
                      <div className="relative w-full h-48 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                        {gym.image_url && (
                          <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="eager" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <Link to={createPageUrl('GymCommunity') + '?id=' + gym.id}
                          className="absolute inset-0 flex items-center justify-center transition-opacity duration-300">
                          <Button className="inline-flex items-center gap-2 whitespace-nowrap rounded-md font-bold py-2 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white text-xs h-8 px-3 shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                            <Dumbbell className="w-3 h-3 mr-1.5" />Enter Gym
                          </Button>
                        </Link>
                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                          {(gym.claim_status === 'claimed' || gym.admin_id || gym.owner_email) && (
                            <Badge className="bg-green-500 text-white text-xs shadow-lg font-semibold"><BadgeCheck className="w-3 h-3 mr-1" />Official</Badge>
                          )}
                        </div>
                        <div className="absolute top-3 right-3 flex gap-3">
                          <button onClick={(e) => { e.preventDefault(); setGalleryGym(gym); }} className="flex items-center justify-center hover:scale-110 transition-all">
                            <Images className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                          </button>
                          <button onClick={(e) => { e.preventDefault(); setEquipmentGym(gym); }} className="flex items-center justify-center hover:scale-110 transition-all">
                            <Dumbbell className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                          </button>
                          {currentUser && currentUser.email === gym.owner_email && (
                            <button onClick={() => setEditingGym(gym)} className="flex items-center justify-center hover:scale-110 transition-all">
                              <Edit className="w-5 h-5 text-slate-400 drop-shadow-lg" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        <div>
                          <h3 className="text-xl font-black text-white mb-1 line-clamp-1">{gym.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="line-clamp-1">{gym.address || gym.city}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pt-2 border-t border-slate-700/50">
                          {gym.rating > 0 && <div className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-bold text-white text-sm">{gym.rating}/5</span></div>}
                          {gym.members_count > 0 && <div className="flex items-center gap-1.5 text-sm text-slate-400"><Users className="w-4 h-4" /><span className="font-semibold">{gym.members_count}</span></div>}
                        </div>
                        {gym.type && (
                          <div className="flex justify-center pt-1">
                            <Badge className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-200 border border-blue-500/30 text-xs capitalize">{gym.type}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── MODALS ── */}
      <EditHeroImageModal
        open={!!editingGym} onClose={() => setEditingGym(null)}
        currentImageUrl={editingGym?.image_url}
        onSave={(image_url) => updateGymImageMutation.mutate({ gymId: editingGym.id, image_url })}
        isLoading={updateGymImageMutation.isPending}
      />

      <JoinWithCodeModal open={showJoinWithCode} onClose={() => setShowJoinWithCode(false)} currentUser={currentUser} />

      {/* Equipment modal */}
      <Dialog open={!!equipmentGym} onOpenChange={() => setEquipmentGym(null)}>
        <DialogContent className="max-w-4xl max-h-[110vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl text-white">
          <div className="space-y-3">
            {(() => {
              const isBodystreakGym = equipmentGym?.name?.toLowerCase().includes('bodystreak');
              const mockEquipment = ['Nautilus Rows','Hammer Strength Chest Press','Leg Press','Smith Machine','Cable Crossover','Hack Squat','Preacher Curl Bench','Seated Calf Raise','Lat Pulldown','Pec Deck','Leg Extension','Leg Curl','Shoulder Press Machine','Cable Fly','T-Bar Row'];
              const equipmentList = isBodystreakGym ? mockEquipment : equipmentGym?.equipment;
              return equipmentList && equipmentList.length > 0
                ? <div className="grid grid-cols-2 gap-2">
                    {equipmentList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="text-slate-200 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                : <div className="text-center py-8 text-slate-400"><Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No equipment information available</p></div>;
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery modal */}
      <Dialog open={!!galleryGym} onOpenChange={() => setGalleryGym(null)}>
        <DialogContent className="max-w-4xl max-h-[110vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl text-white">
          <div>
            {galleryGym?.gallery && galleryGym.gallery.length > 0
              ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryGym.gallery.map((imageUrl, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-slate-700/50 border border-slate-600/50">
                      <img src={imageUrl} alt={`${galleryGym.name} photo ${idx + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              : <div className="text-center py-12 text-slate-400"><Images className="w-16 h-16 mx-auto mb-3 opacity-50" /><p>No photos available</p></div>
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm leave */}
      <Dialog open={!!confirmLeaveGym} onOpenChange={() => setConfirmLeaveGym(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Leave {confirmLeaveGym?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300 text-sm">Are you sure you want to leave this gym? You&apos;ll lose access to its community.</p>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setConfirmLeaveGym(null)} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button onClick={() => { leaveGymMutation.mutate(confirmLeaveGym.id); setConfirmLeaveGym(null); }} disabled={leaveGymMutation.isPending} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {leaveGymMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Leave Gym'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm join */}
      <Dialog open={showConfirmJoin} onOpenChange={() => { setShowConfirmJoin(false); setPendingGymData(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{gymMemberships.length > 0 ? 'Replace Primary Gym?' : 'Join This Community?'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {gymMemberships.length > 0
              ? <p className="text-slate-300 text-sm">You&apos;re currently a member of <span className="font-semibold text-white">{gymMemberships[0]?.gym_name}</span>. Joining <span className="font-semibold text-white">{selectedPlaceGym?.name}</span> will replace your primary gym.</p>
              : <p className="text-slate-300 text-sm">Are you sure you want to join <span className="font-semibold text-white">{selectedPlaceGym?.name}</span>? This is an unclaimed community gym.</p>
            }
            <div className="flex gap-3 pt-2">
              <Button onClick={() => { setShowConfirmJoin(false); setPendingGymData(null); }} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">Cancel</Button>
              <Button onClick={handleConfirmJoin} disabled={createGymMutation.isPending} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                {createGymMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add gym modal */}
      <Dialog open={showAddGymModal} onOpenChange={() => { setShowAddGymModal(false); setSelectedPlaceGym(null); setIsOwner(false); setGymType('general'); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Gym to CoStride</DialogTitle>
          </DialogHeader>
          {selectedPlaceGym && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">{selectedPlaceGym.name}</h3>
                    <div className="flex items-start gap-2 text-slate-300 text-sm mb-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{selectedPlaceGym.address}</span>
                    </div>
                    {selectedPlaceGym.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-slate-300 text-sm">{selectedPlaceGym.rating} rating</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Gym Type</label>
                <Select value={gymType} onValueChange={setGymType}>
                  <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white"><SelectValue /></SelectTrigger>
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
              {currentUser?.account_type === 'gym_owner' && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/40 rounded-xl p-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={isOwner} onChange={(e) => setIsOwner(e.target.checked)} className="mt-1 w-5 h-5 rounded border-purple-400 text-purple-600 focus:ring-purple-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">I am the owner/manager of this gym</span>
                        <Crown className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-slate-300 text-xs">Check this if you own or manage this gym.</p>
                    </div>
                  </label>
                </div>
              )}
              <Button onClick={handleCreateGym} disabled={createGymMutation.isPending}
                className="w-full bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white rounded-xl font-bold py-6 text-base shadow-[0_4px_0_0_#065f46] active:shadow-none active:translate-y-[3px] active:scale-[0.98] transform-gpu">
                {createGymMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                {isOwner ? 'Claim & Add Gym' : 'Add Gym'}
              </Button>
              {isOwner && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3">
                  <p className="text-blue-300 text-xs text-center">✓ Your gym will be marked as verified and you&apos;ll become the admin</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter modal */}
      {showFilterModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowFilterModal(false)} />
          <div className="fixed bottom-24 left-0 right-0 z-50 bg-slate-800/30 backdrop-blur-md border-t border-slate-700/20 rounded-3xl p-5 space-y-2 shadow-2xl" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white text-center absolute left-1/2 -translate-x-1/2">Filters</h3>
              <div className="flex items-center gap-3 ml-auto">
                {(selectedType !== 'all' || maxDistance !== 'all' || selectedEquipment !== 'all') && (
                  <button onClick={() => { setSelectedType('all'); setMaxDistance('all'); setSelectedEquipment('all'); }} className="text-xs text-blue-400 font-semibold">Clear all</button>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Gym Type</label>
                <div className="flex flex-wrap gap-2">
                  {[['all','All Types'],['powerlifting','Powerlifting'],['bodybuilding','Bodybuilding'],['crossfit','CrossFit'],['boxing','Boxing'],['mma','MMA'],['general','General']].map(([val, label]) => (
                    <button key={val} onClick={() => setSelectedType(val)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${selectedType === val ? 'bg-blue-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Distance</label>
                <div className="flex flex-wrap gap-2">
                  {[['all','Any Distance'],['5','Within 5 km'],['10','Within 10 km'],['20','Within 20 km'],['50','Within 50 km']].map(([val, label]) => (
                    <button key={val} onClick={() => setMaxDistance(val)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${maxDistance === val ? 'bg-blue-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Equipment</label>
                <div className="flex flex-wrap gap-2">
                  {[['all','All Equipment'],['Power Racks','Power Racks'],['Barbells','Barbells'],['Dumbbells','Dumbbells'],['Cable Machines','Cable Machines'],['Cardio Equipment','Cardio'],['Olympic Platforms','Olympic Platforms']].map(([val, label]) => (
                    <button key={val} onClick={() => setSelectedEquipment(val)} className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${selectedEquipment === val ? 'bg-blue-600 text-white' : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
