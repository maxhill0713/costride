import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, Download, Share2, Dumbbell } from 'lucide-react';
import { createPageUrl } from '../../utils';

export default function GymJoinPoster({ gym, open, onClose }) {
  const posterRef = useRef(null);

  if (!open || !gym) return null;

  const joinUrl = `${window.location.origin}${createPageUrl('Gyms')}?joinCode=${gym.join_code}`;

  const handleDownload = async () => {
    const el = posterRef.current;
    if (!el) return;

    // Use html2canvas if available, otherwise SVG fallback
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#0a0f1e',
      });
      const a = document.createElement('a');
      a.download = `${gym.name}-join-poster.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${gym.name}`,
          text: `Join ${gym.name} using code: ${gym.join_code}`,
          url: joinUrl,
        });
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(joinUrl);
      alert('Join link copied to clipboard!');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Gym Join Flyer</span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer' }}>
            <X style={{ width: 15, height: 15 }}/>
          </button>
        </div>

        {/* Poster */}
        <div ref={posterRef} style={{
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #0a0f1e 0%, #0d1f3c 40%, #0a1628 100%)',
          border: '1px solid rgba(14,165,233,0.3)',
          boxShadow: '0 0 60px rgba(14,165,233,0.15)',
          padding: '40px 36px 36px',
          position: 'relative',
        }}>
          {/* Background decoration */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }}/>

          {/* Logo + Gym name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            {gym.logo_url ? (
              <img src={gym.logo_url} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', border: '2px solid rgba(14,165,233,0.4)' }}/>
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(14,165,233,0.4)' }}>
                <Dumbbell style={{ width: 24, height: 24, color: '#fff' }}/>
              </div>
            )}
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{gym.name}</div>
              <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{gym.type} · {gym.city}</div>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 8 }}>
              Join Our <span style={{ background: 'linear-gradient(135deg,#0ea5e9,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Community</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              Scan the QR code or enter the join code below to connect with your gym community.
            </div>
          </div>

          {/* QR + Code side by side */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
            {/* QR Code */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 14,
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <QRCode value={joinUrl} size={120} level="H"/>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}>
              <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }}/>
              OR
              <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.1)' }}/>
            </div>

            {/* Join Code */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Join Code</div>
              <div style={{
                fontSize: 38, fontWeight: 900, letterSpacing: '0.2em',
                color: '#fff',
                background: 'rgba(14,165,233,0.1)',
                border: '1px solid rgba(14,165,233,0.3)',
                borderRadius: 12,
                padding: '12px 16px',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}>
                {gym.join_code}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                Enter this code in the CoStride app
              </div>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingTop: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
              Powered by CoStride
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              costride.app
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDownload} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 12,
            background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
          }}>
            <Download style={{ width: 16, height: 16 }}/> Download Flyer
          </button>
          <button onClick={handleShare} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 12,
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#c4b5fd', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            <Share2 style={{ width: 16, height: 16 }}/> Share Link
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
          Print or display this flyer around your gym to let members join your community
        </p>
      </div>
    </div>
  );
}