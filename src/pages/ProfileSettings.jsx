import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Check, X } from 'lucide-react';

const PAGE_BG  = 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)';
const GROUP_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';
const DIVIDER  = 'rgba(255,255,255,0.06)';

function useSectionHighlight() {
  const { search } = useLocation();
  const section = new URLSearchParams(search).get('section');
  const [highlighted, setHighlighted] = useState(null);
  useEffect(() => {
    if (!section) return;
    setHighlighted(section);
    const t1 = setTimeout(() => { document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
    const t2 = setTimeout(() => setHighlighted(null), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [section]);
  return highlighted;
}

function PageShell({ title, children }) {
  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, color: '#fff', fontFamily: 'inherit' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,4,10,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: 'max(env(safe-area-inset-top), 10px) 16px 10px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to={createPageUrl('Settings')} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '4px 8px 4px 0' }}>
            <ChevronLeft style={{ width: 22, height: 22, color: '#94a3b8' }} />
          </Link>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em', color: '#fff' }}>{title}</span>
        </div>
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 60px' }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', padding: '0 4px', marginBottom: 8, marginTop: 4 }}>{children}</div>;
}

function Group({ sectionId, highlighted, children }) {
  const isHighlighted = highlighted === sectionId;
  return (
    <div id={sectionId ? `section-${sectionId}` : undefined} style={{ background: GROUP_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 20, transition: 'box-shadow 0.4s ease', boxShadow: isHighlighted ? '0 0 0 2px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.2)' : 'none' }}>
      {children}
    </div>
  );
}

function Row({ label, sublabel, children, isLast }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52 }}>
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: '#475569', marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function cropToBlob(imageSrc, cropRect, outputSize) {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width  = outputSize.w;
  canvas.height = outputSize.h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    img,
    cropRect.x, cropRect.y, cropRect.w, cropRect.h,
    0, 0, outputSize.w, outputSize.h
  );
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

function CircleCropModal({ imageSrc, onConfirm, onCancel, uploading }) {
  const containerRef = useRef(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const CROP_SIZE = 260;

  useEffect(() => {
    loadImage(imageSrc).then(img => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const fit = CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(fit);
      scaleRef.current = fit;
      setOffset({ x: 0, y: 0 });
    });
  }, [imageSrc]);

  const clamp = useCallback((ox, oy, sc) => {
    const rw = imgNatural.w * sc;
    const rh = imgNatural.h * sc;
    const half = CROP_SIZE / 2;
    return {
      x: Math.min(half, Math.max(half - rw, ox)),
      y: Math.min(half, Math.max(half - rh, oy)),
    };
  }, [imgNatural, CROP_SIZE]);

  // Keep a ref to scale so RAF callbacks always see the latest value
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // ── Smooth drag via RAF ──
  const drag = useRef(null);
  const rafId = useRef(null);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX - offset.x, startY: e.clientY - offset.y };
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    const nx = e.clientX - drag.current.startX;
    const ny = e.clientY - drag.current.startY;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setOffset(clamp(nx, ny, scaleRef.current));
    });
  };

  const onPointerUp = () => { drag.current = null; };

  // ── Pinch zoom — uniform scale only, no distortion ──
  const lastDist = useRef(null);

  const onTouchMove = (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (lastDist.current != null) {
      const delta = (dist - lastDist.current) * 0.008;
      setScale(s => {
        const ns = Math.max(0.5, Math.min(4, s + delta));
        scaleRef.current = ns;
        setOffset(o => clamp(o.x, o.y, ns));
        return ns;
      });
    }
    lastDist.current = dist;
  };

  const onTouchEnd = () => { lastDist.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    setScale(s => {
      const ns = Math.max(0.5, Math.min(4, s - e.deltaY * 0.002));
      scaleRef.current = ns;
      setOffset(o => clamp(o.x, o.y, ns));
      return ns;
    });
  };

  const handleConfirm = async () => {
    const rw = imgNatural.w * scale;
    const rh = imgNatural.h * scale;
    const imgLeft = CROP_SIZE / 2 + offset.x;
    const imgTop  = CROP_SIZE / 2 + offset.y;
    const cropX = (-imgLeft / rw) * imgNatural.w;
    const cropY = (-imgTop  / rh) * imgNatural.h;
    const cropW = (CROP_SIZE / rw) * imgNatural.w;
    const cropH = (CROP_SIZE / rh) * imgNatural.h;
    const blob = await cropToBlob(imageSrc, { x: cropX, y: cropY, w: cropW, h: cropH }, { w: 400, h: 400 });
    onConfirm(blob);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Drag to position</p>

      <div
        ref={containerRef}
        style={{ position: 'relative', width: CROP_SIZE, height: CROP_SIZE, userSelect: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        {/* Clipped circle — no dark overlay */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', cursor: 'grab' }}>
          <img
            src={imageSrc}
            draggable={false}
            style={{
              position: 'absolute',
              width: imgNatural.w * scale,
              height: imgNatural.h * scale,
              left: CROP_SIZE / 2 + offset.x,
              top:  CROP_SIZE / 2 + offset.y,
              pointerEvents: 'none',
              userSelect: 'none',
              willChange: 'transform',
            }}
          />
        </div>

        {/* Circle border ring */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', pointerEvents: 'none' }} />
      </div>

      <p style={{ color: '#475569', fontSize: 11, fontWeight: 500 }}>Pinch or scroll to zoom</p>

      <div style={{ display: 'flex', gap: 12, width: CROP_SIZE }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(to bottom, #1e2535 0%, #0f1520 100%)', color: '#94a3b8', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 0 0 #0a0f1a' }}>
          <X style={{ width: 15, height: 15 }} /> Cancel
        </button>
        <button onClick={handleConfirm} disabled={uploading} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: uploading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: uploading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: uploading ? 'none' : '0 4px 0 0 #1a3fa8' }}>
          {uploading ? 'Saving…' : <><Check style={{ width: 15, height: 15 }} /> Save</>}
        </button>
      </div>
    </div>
  );
}

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const highlighted = useSectionHighlight();

  const [circleCrop, setCircleCrop] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [localFullName, setLocalFullName]   = useState('');
  const [nameEditing,   setNameEditing]     = useState(false);
  const [nameSaving,    setNameSaving]      = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    if (currentUser) setLocalFullName(currentUser.display_name || currentUser.full_name || '');
  }, [currentUser?.display_name, currentUser?.full_name]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => { await base44.auth.updateMe(settings); return base44.auth.me(); },
    onSuccess: (u) => {
      queryClient.setQueryData(['currentUser'], u);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setCircleCrop({ src });
    e.target.value = '';
  };

  const handleAvatarCropConfirm = async (blob) => {
    setUploadingAvatar(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateSettingsMutation.mutateAsync({ avatar_url: file_url });
      setCircleCrop(null);
    } catch (err) {
      console.error('[ProfileSettings] avatar upload failed:', err);
      alert('Failed to upload photo — ' + (err?.message || 'unknown error'));
    }
    finally { setUploadingAvatar(false); }
  };

  const handleNameSave = async () => {
    setNameSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({ display_name: localFullName.trim() });
      setNameEditing(false);
    } catch (err) {
      console.error('[ProfileSettings] name save failed:', err);
      alert('Failed to save name — ' + (err?.message || 'unknown error'));
    }
    finally { setNameSaving(false); }
  };

  const handleNameCancel = () => {
    setLocalFullName(currentUser?.full_name || '');
    setNameEditing(false);
  };

  if (!currentUser) return <PageShell title="Profile"><p style={{ color: '#475569', textAlign: 'center', paddingTop: 40 }}>Loading…</p></PageShell>;

  return (
    <>
      <PageShell title="Profile">

        <SectionLabel>Profile picture</SectionLabel>
        <Group sectionId="avatar" highlighted={highlighted}>
          <Row label="Photo" sublabel="Shown on your profile and posts" isLast>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentUser.avatar_url
                  ? <img src={currentUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{currentUser.full_name?.charAt(0)?.toUpperCase()}</span>}
              </div>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                <div style={{ padding: '7px 14px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Change
                </div>
              </label>
            </div>
          </Row>
        </Group>

        <SectionLabel>Display name</SectionLabel>
        <Group sectionId="name" highlighted={highlighted}>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 12, color: '#475569', marginBottom: 8, fontWeight: 500 }}>
              Your display name can include spaces and doesn't need to be unique. This is the name shown on your profile and posts.
            </p>
            <input
              value={localFullName}
              onChange={e => { setLocalFullName(e.target.value); setNameEditing(true); }}
              placeholder="Your display name"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${nameEditing ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: '#e2e8f0', fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
            />

            {nameEditing && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#0a0f1a', transform: 'translateY(4px)' }} />
                  <button
                    onClick={handleNameCancel}
                    style={{ position: 'relative', zIndex: 1, width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(to bottom, #1e2535 0%, #0f1520 100%)', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 0 0 #0a0f1a, inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    Cancel
                  </button>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#1a3fa8', transform: 'translateY(4px)' }} />
                  <button
                    onClick={handleNameSave}
                    disabled={nameSaving || !localFullName.trim()}
                    style={{ position: 'relative', zIndex: 1, width: '100%', padding: '10px 0', borderRadius: 12, border: 'none', background: nameSaving ? 'rgba(59,130,246,0.5)' : 'linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: nameSaving || !localFullName.trim() ? 'default' : 'pointer', boxShadow: nameSaving ? 'none' : '0 4px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)', opacity: !localFullName.trim() ? 0.5 : 1 }}>
                    {nameSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Group>

      </PageShell>

      {circleCrop && (
        <CircleCropModal
          imageSrc={circleCrop.src}
          uploading={uploadingAvatar}
          onConfirm={handleAvatarCropConfirm}
          onCancel={() => setCircleCrop(null)}
        />
      )}
    </>
  );
}