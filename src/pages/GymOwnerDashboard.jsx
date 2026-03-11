import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { X, Download, Share2, Dumbbell, Zap, Users, Trophy, Check, Copy } from 'lucide-react';
import { createPageUrl } from '../../utils';

export default function GymJoinPoster({ gym, open, onClose }) {
  const posterRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!open || !gym) return null;

  const joinUrl = `${window.location.origin}${createPageUrl('Gyms')}?joinCode=${gym.join_code}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        scale: 3, useCORS: true, backgroundColor: '#03070f',
        logging: false,
      });
      const a = document.createElement('a');
      a.download = `${gym.name.replace(/\s+/g, '-')}-flyer.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Join ${gym.name} on CoStride`, text: `Use code ${gym.join_code} to join`, url: joinUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(16px)',
      padding: '16px', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14, margin: 'auto' }}>

        {/* Modal chrome */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Gym Join Flyer</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Print or display around your gym</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            <X style={{ width: 15, height: 15 }}/>
          </button>
        </div>

        {/* ════════════════ POSTER ════════════════ */}
        <div ref={posterRef} style={{
          borderRadius: 24, overflow: 'hidden',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          background: '#03070f',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)',
        }}>

          {/* ── HERO BAND ── */}
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(145deg, #03122b 0%, #051833 50%, #03070f 100%)',
            padding: '36px 32px 32px',
          }}>
            {/* Grid */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }}/>
            {/* Glow top-right */}
            <div style={{ position: 'absolute', top: -100, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 60%)', pointerEvents: 'none' }}/>
            {/* Glow bottom-left */}
            <div style={{ position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 60%)', pointerEvents: 'none' }}/>

            {/* Top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #0ea5e9, #06b6d4, #8b5cf6, #ec4899)' }}/>

            {/* Gym identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32, position: 'relative', zIndex: 1 }}>
              {gym.logo_url ? (
                <img src={gym.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(6,182,212,0.5)', boxShadow: '0 0 28px rgba(6,182,212,0.35)' }}/>
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 16, flexShrink: 0, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.25)' }}>
                  <Dumbbell style={{ width: 28, height: 28, color: '#fff' }}/>
                </div>
              )}
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{gym.name}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                  {[gym.type, gym.city].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>

            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, position: 'relative', zIndex: 1 }}>
              <div style={{ height: 2, width: 20, background: 'linear-gradient(90deg,#0ea5e9,transparent)', borderRadius: 99 }}/>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.2em' }}>You're invited</span>
              <div style={{ height: 2, flex: 1, background: 'linear-gradient(90deg,#0ea5e9,transparent)', borderRadius: 99 }}/>
            </div>

            {/* Big headline */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 16 }}>
              <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 0.88, letterSpacing: '-0.05em', color: '#fff' }}>
                JOIN<br/>THE<br/>
                <span style={{
                  background: 'linear-gradient(110deg, #22d3ee 10%, #818cf8 55%, #e879f9 90%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>CREW.</span>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, position: 'relative', zIndex: 1, maxWidth: 300, marginBottom: 22 }}>
              Track workouts, crush challenges, climb the leaderboard — all with your gym family.
            </div>

            {/* Feature badges */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              {[
                { icon: Zap,    label: 'Check-ins',   c: '#22d3ee', bg: 'rgba(6,182,212,0.1)',  b: 'rgba(6,182,212,0.25)' },
                { icon: Trophy, label: 'Challenges',  c: '#fbbf24', bg: 'rgba(251,191,36,0.1)', b: 'rgba(251,191,36,0.25)' },
                { icon: Users,  label: 'Community',   c: '#a78bfa', bg: 'rgba(167,139,250,0.1)',b: 'rgba(167,139,250,0.25)' },
              ].map(({ icon: Icon, label, c, bg, b }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, background: bg, border: `1px solid ${b}`, fontSize: 11, fontWeight: 700, color: c }}>
                  <Icon style={{ width: 11, height: 11 }}/>{label}
                </div>
              ))}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(139,92,246,0.3), transparent)' }}/>

          {/* ── QR SECTION ── */}
          <div style={{
            background: 'linear-gradient(180deg, #060d1f 0%, #03070f 100%)',
            padding: '28px 32px 32px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)', pointerEvents: 'none' }}/>

            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
              Scan to join instantly
            </div>

            {/* QR centred + large */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                background: '#fff', borderRadius: 20, padding: 18,
                boxShadow: '0 0 0 1px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.15), 0 16px 48px rgba(0,0,0,0.6)',
              }}>
                <QRCode value={joinUrl} size={160} level="H"/>
              </div>
            </div>

            {/* OR divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em' }}>OR ENTER CODE</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}/>
            </div>

            {/* Join code — full width, big and proud */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))',
              border: '1.5px solid rgba(6,182,212,0.3)',
              borderRadius: 16, padding: '18px 20px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 32px rgba(6,182,212,0.06)',
              textAlign: 'center', marginBottom: 10,
            }}>
              <div style={{
                fontSize: 56, fontWeight: 900, letterSpacing: '0.22em',
                color: '#fff', fontFamily: "'Courier New', monospace",
                lineHeight: 1,
                textShadow: '0 0 30px rgba(6,182,212,0.5)',
                paddingLeft: '0.22em', // offset for letter-spacing
              }}>
                {gym.join_code}
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 28 }}>
              Open <span style={{ color: '#22d3ee', fontWeight: 700 }}>CoStride</span> and tap <em>"Join a Gym"</em>
            </div>

            {/* Bottom branding */}
            <div style={{
              paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(6,182,212,0.3)' }}>
                  <Dumbbell style={{ width: 11, height: 11, color: '#fff' }}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Powered by CoStride</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.04em' }}>costride.app</span>
            </div>
          </div>
        </div>
        {/* ════════════════ END POSTER ════════════════ */}

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={handleDownload} disabled={downloading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '12px', borderRadius: 12, cursor: 'pointer',
            background: downloading ? 'rgba(6,182,212,0.4)' : 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
            color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 24px rgba(6,182,212,0.35)', transition: 'all 0.2s',
          }}>
            <Download style={{ width: 15, height: 15 }}/>{downloading ? 'Saving…' : 'Download'}
          </button>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '12px', borderRadius: 12, cursor: 'pointer',
            background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)',
            border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(139,92,246,0.35)'}`,
            color: copied ? '#34d399' : '#c4b5fd', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
          }}>
            {copied ? <><Check style={{ width: 15, height: 15 }}/> Copied!</> : <><Share2 style={{ width: 15, height: 15 }}/> Share Link</>}
          </button>
        </div>

      </div>
    </div>
  );
}