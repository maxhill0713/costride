import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, Download, Share2, Dumbbell, Zap, Users, Trophy } from 'lucide-react';
import { createPageUrl } from '../../utils';

export default function GymJoinPoster({ gym, open, onClose }) {
  const posterRef = useRef(null);

  if (!open || !gym) return null;

  const joinUrl = `${window.location.origin}${createPageUrl('Gyms')}?joinCode=${gym.join_code}`;

  const handleDownload = async () => {
    const el = posterRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#050810' });
      const a = document.createElement('a');
      a.download = `${gym.name}-flyer.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch { }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Join ${gym.name}`, text: `Join using code: ${gym.join_code}`, url: joinUrl }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(joinUrl);
      alert('Join link copied!');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Gym Join Flyer</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}>
            <X style={{ width: 14, height: 14 }}/>
          </button>
        </div>

        {/* ── POSTER ── */}
        <div ref={posterRef} style={{
          borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: '#050810',
          fontFamily: "'Outfit', 'Inter', sans-serif",
        }}>

          {/* Top cyan accent bar */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #0ea5e9, #06b6d4, #8b5cf6)', width: '100%' }}/>

          {/* Hero section — dark with grid */}
          <div style={{
            padding: '32px 32px 28px',
            background: 'linear-gradient(160deg, #050c1a 0%, #071225 60%, #050810 100%)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Subtle grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              pointerEvents: 'none',
            }}/>

            {/* Glow blobs */}
            <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 65%)', pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', bottom: -60, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 65%)', pointerEvents: 'none' }}/>

            {/* Gym brand row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, position: 'relative' }}>
              {gym.logo_url ? (
                <img src={gym.logo_url} alt="" style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(14,165,233,0.5)', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}/>
              ) : (
                <div style={{ width: 54, height: 54, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(14,165,233,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  <Dumbbell style={{ width: 26, height: 26, color: '#fff' }}/>
                </div>
              )}
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05 }}>{gym.name}</div>
                <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                  {gym.type}{gym.city ? ` · ${gym.city}` : ''}
                </div>
              </div>
            </div>

            {/* Main headline */}
            <div style={{ marginBottom: 10, position: 'relative' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 2, background: '#0ea5e9', borderRadius: 99 }}/>
                You're invited
                <div style={{ width: 16, height: 2, background: '#0ea5e9', borderRadius: 99 }}/>
              </div>
              <div style={{ fontSize: 46, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: 12 }}>
                JOIN THE<br/>
                <span style={{ background: 'linear-gradient(135deg,#0ea5e9 20%,#8b5cf6 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>COMMUNITY.</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55, maxWidth: 320 }}>
                Track workouts, join challenges, and connect with fellow members — all in one place.
              </div>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {[
                { icon: Zap,    label: 'Check-in Tracking' },
                { icon: Trophy, label: 'Challenges' },
                { icon: Users,  label: 'Community' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.22)', fontSize: 11, fontWeight: 700, color: '#7dd3fc' }}>
                  <Icon style={{ width: 11, height: 11 }}/>{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── QR + Code section ── */}
          <div style={{
            padding: '28px 32px 32px',
            background: 'linear-gradient(180deg, #070d1c 0%, #050810 100%)',
            position: 'relative',
          }}>
            {/* Step label */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 16 }}>
              Scan to join instantly
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
              {/* QR Code */}
              <div style={{
                background: '#fff', borderRadius: 16, padding: 14, flexShrink: 0,
                boxShadow: '0 0 0 1px rgba(14,165,233,0.3), 0 12px 40px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <QRCode value={joinUrl} size={130} level="H"/>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.08)' }}/>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>OR</span>
                <div style={{ flex: 1, width: 1, background: 'rgba(255,255,255,0.08)' }}/>
              </div>

              {/* Code block */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Enter code</div>
                <div style={{
                  background: 'rgba(14,165,233,0.07)',
                  border: '1.5px solid rgba(14,165,233,0.35)',
                  borderRadius: 14, padding: '16px 14px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 24px rgba(14,165,233,0.08)',
                }}>
                  <div style={{
                    fontSize: 42, fontWeight: 900, letterSpacing: '0.22em',
                    color: '#fff', fontFamily: "'Courier New', monospace",
                    lineHeight: 1, textShadow: '0 0 20px rgba(14,165,233,0.4)',
                  }}>
                    {gym.join_code}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.4 }}>
                  Open the <span style={{ color: '#38bdf8', fontWeight: 700 }}>CoStride</span> app and enter this code
                </div>
              </div>
            </div>

            {/* Bottom strip */}
            <div style={{
              marginTop: 24, paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dumbbell style={{ width: 10, height: 10, color: '#fff' }}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>Powered by CoStride</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>costride.app</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownload} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px', borderRadius: 12,
            background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
          }}>
            <Download style={{ width: 15, height: 15 }}/> Download Flyer
          </button>
          <button onClick={handleShare} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px', borderRadius: 12,
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#c4b5fd', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <Share2 style={{ width: 15, height: 15 }}/> Share Link
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
          Print or display around your gym to grow your community
        </p>
      </div>
    </div>
  );
}