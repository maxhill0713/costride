import React, { useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserLocation, checkDistanceToGyms } from '@/lib/geolocation';

const CHECK_IN_CSS = `
  @keyframes ci-ripple {
    0%   { transform: scale(0); opacity: 0.55; }
    100% { transform: scale(48); opacity: 0; }
  }
  @keyframes ci-tick-draw {
    from { stroke-dashoffset: 40; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes ci-tick-pop {
    0%   { transform: scale(0.4); opacity: 0; }
    60%  { transform: scale(1.18); opacity: 1; }
    80%  { transform: scale(0.94); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes ci-success-fade {
    0%   { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes ci-fadeout {
    0%   { opacity: 1; transform: scaleY(1); }
    80%  { opacity: 1; transform: scaleY(1); }
    100% { opacity: 0; transform: scaleY(0.85); }
  }
`;

function injectCheckInStyles() {
  if (document.getElementById('checkin-btn-styles')) return;
  const s = document.createElement('style');
  s.id = 'checkin-btn-styles';
  s.textContent = CHECK_IN_CSS;
  document.head.appendChild(s);
}

function soundBounceIn(ctx) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.start(now); osc.stop(now + 0.3);
}

export default function LocationBasedCheckInButton({ gyms, onCheckInSuccess, gymMemberships }) {
  const queryClient = useQueryClient();
  const [pressed, setPressed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ripples, setRipples] = useState([]);
  const [failureMsg, setFailureMsg] = useState(null);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [selectedGym, setSelectedGym] = useState(null);
  const btnRef = useRef(null);
  const rippleId = useRef(0);
  const audioCtxRef = useRef(null);
  const failureTimer = useRef(null);

  // Check location on mount — silently, no error banners
  useEffect(() => {
    const checkLocationOnMount = async () => {
      const userLocation = await getUserLocation();
      if (!userLocation || !gyms || gyms.length === 0) {
        setIsCheckingLocation(false);
        return;
      }

      const gymList = gyms.map(g => ({ id: g.id, name: g.name, latitude: g.latitude, longitude: g.longitude }));
      const { isWithinRange: inRange, nearestGym } = checkDistanceToGyms(
        userLocation.latitude,
        userLocation.longitude,
        gymList,
        500
      );

      if (inRange && nearestGym) {
        const closest = gyms.find(g => g.id === nearestGym.id);
        setSelectedGym(closest);
      }
      setIsCheckingLocation(false);
    };

    checkLocationOnMount();
  }, [gyms]);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGym?.id) throw new Error('No gym selected for check-in');
      const userLocation = await getUserLocation();
      return base44.functions.invoke('performCheckIn', {
        gymId: selectedGym.id,
        userLat: userLocation?.latitude ?? null,
        userLon: userLocation?.longitude ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: q => q.queryKey[0] === 'checkIns' });
      queryClient.invalidateQueries({ predicate: q => q.queryKey[0] === 'currentUser' });
      queryClient.invalidateQueries({ predicate: q => q.queryKey[0] === 'weeklyWorkoutLogs' });
      setSuccess(true);
      onCheckInSuccess?.();
      // Show green tick for 1.8s then fade out and unmount
      setTimeout(() => setVisible(false), 1800);
    },
    onError: () => {
      // Clear any existing timer
      if (failureTimer.current) clearTimeout(failureTimer.current);
      setFailureMsg('Check in has failed, if this problem persists contact CoStride support');
      failureTimer.current = setTimeout(() => setFailureMsg(null), 10000);
    },
  });

  const spawnRipple = (e) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top;
    const id = ++rippleId.current;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  };

  const handlePress = async (e) => {
    if (checkInMutation.isPending || success) return;
    setPressed(true);
    spawnRipple(e);
    setFailureMsg(null);
    setTimeout(() => setPressed(false), 100);

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current) soundBounceIn(audioCtxRef.current);
      checkInMutation.mutate();
    } catch (error) {
      console.error('Check-in error:', error);
      setPressed(false);
    }
  };

  const handleRelease = () => {
    if (!pressed) return;
    setPressed(false);
  };

  // Don't render until we've finished the initial location check
  if (isCheckingLocation) return null;
  // Only show button if a gym is in range
  if (!selectedGym) return null;
  // Fully unmounted after success fade
  if (!visible) return null;

  const isLoading = checkInMutation.isPending;
  const isSuccess = success;

  return (
    <>
      {injectCheckInStyles()}

      {/* Failure message — 10 second auto-dismiss */}
      {failureMsg && (
        <div style={{
          marginBottom: 10,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(255,77,109,0.12)',
          border: '1px solid rgba(255,77,109,0.35)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="10" cy="10" r="9" stroke="#ff4d6d" strokeWidth="1.8" />
            <path d="M10 6v5" stroke="#ff4d6d" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10" cy="14.5" r="1" fill="#ff4d6d" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ff6b85', lineHeight: 1.4 }}>
            {failureMsg}
          </span>
        </div>
      )}

      {/* Button wrapper — fades out after success */}
      <div style={{
        position: 'relative',
        animation: isSuccess ? 'ci-fadeout 2s ease forwards' : 'none',
        transformOrigin: 'top center',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18,
          background: isSuccess ? '#15803d' : '#1a3fa8',
          transform: 'translateY(5px)',
        }} />
        <button
          ref={btnRef}
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onMouseLeave={() => { if (pressed) setPressed(false); }}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
          disabled={isLoading || isSuccess}
          style={{
            position: 'relative', zIndex: 1,
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px 24px',
            borderRadius: 18, border: 'none',
            cursor: isLoading || isSuccess ? 'default' : 'pointer',
            outline: 'none', overflow: 'hidden',
            WebkitTapHighlightColor: 'transparent', userSelect: 'none',
            transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.25s ease',
            transform: pressed ? 'translateY(5px)' : 'translateY(0)',
            boxShadow: pressed ? 'none' :
              isSuccess ?
              '0 5px 0 0 #15803d, 0 8px 24px rgba(22,163,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' :
              '0 5px 0 0 #1a3fa8, 0 8px 28px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            background: isSuccess ?
              'linear-gradient(to bottom, #4ade80, #22c55e 40%, #16a34a)' :
              isLoading ?
              'linear-gradient(to bottom, #5b9ff5, #3b82f6 40%, #2563eb)' :
              'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #2563eb)',
          }}>
          {ripples.map((r) => (
            <span key={r.id} style={{
              position: 'absolute', left: r.x, top: r.y,
              width: 10, height: 10, borderRadius: '50%',
              background: 'rgba(255,255,255,0.35)', transform: 'scale(0)',
              animation: 'ci-ripple 0.65s ease-out forwards',
              pointerEvents: 'none', zIndex: 0, marginLeft: -5, marginTop: -5,
            }} />
          ))}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            {isSuccess ? (
              <>
                <div style={{ animation: 'ci-tick-pop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards' }}>
                  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                    <path d="M7.5 14.5l4.5 4.5 8.5-9.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: 'ci-tick-draw 0.4s ease 0.1s forwards' }} />
                  </svg>
                </div>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', animation: 'ci-success-fade 0.35s ease forwards' }}>
                  Checked In!
                </span>
              </>
            ) : isLoading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 17, fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
                  Checking...
                </span>
              </>
            ) : (
              <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Check In
              </span>
            )}
          </div>
        </button>
      </div>
    </>
  );
}