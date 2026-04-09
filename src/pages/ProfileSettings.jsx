import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Check, X } from 'lucide-react';

const PAGE_BG  = 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)';
const GROUP_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';
const DIVIDER  = 'rgba(255,255,255,0.06)';
const CROP_SIZE = 260;

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
      <div style={{ position: 'sticky', top: 'env(safe-area-inset-top)', zIndex: 10, background: 'rgba(2,4,10,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px' }}>
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
  ctx.drawImage(img, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, outputSize.w, outputSize.h);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

function CircleCropModal({ imageSrc, onConfirm, onCancel, uploading }) {
  const containerRef = useRef(null);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Refs so event listeners (attached to DOM directly) always see latest values
  const scaleRef   = useRef(scale);
  const offsetRef  = useRef(offset);
  const natRef     = useRef(imgNatural);
  const dragRef    = useRef(null);
  const pinchRef   = useRef(null); // { dist } when pinching
  const isPinching = useRef(false);
  const rafId      = useRef(null);

  useEffect(() => { scaleRef.current  = scale;      }, [scale]);
  useEffect(() => { offsetRef.current = offset;     }, [offset]);
  useEffect(() => { natRef.current    = imgNatural; }, [imgNatural]);

  const getMinScale = (nat) => {
    if (!nat || nat.w <= 0 || nat.h <= 0) return 1;
    return Math.max(CROP_SIZE / nat.w, CROP_SIZE / nat.h);
  };

  // offset = displacement of image CENTRE from circle CENTRE
  // Clamp so image always covers the full circle
  const clampOffset = (ox, oy, sc, nat) => {
    const n   = nat || natRef.current;
    const imgW = n.w * sc;
    const imgH = n.h * sc;
    const maxX = imgW / 2 - CROP_SIZE / 2;
    const maxY = imgH / 2 - CROP_SIZE / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  };

  // Load image → set min scale, centre it
  useEffect(() => {
    loadImage(imageSrc).then(img => {
      const nat = { w: img.naturalWidth, h: img.naturalHeight };
      const ms  = getMinScale(nat);
      setImgNatural(nat);
      natRef.current = nat;
      setScale(ms);
      scaleRef.current = ms;
      setOffset({ x: 0, y: 0 });
      offsetRef.current = { x: 0, y: 0 };
    });
  }, [imageSrc]);

  // ── Pointer (drag) handlers — attached via React props (fine for drag) ──────
  const onPointerDown = (e) => {
    if (isPinching.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX - offsetRef.current.x,
      startY: e.clientY - offsetRef.current.y,
    };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current || isPinching.current) return;
    const nx = e.clientX - dragRef.current.startX;
    const ny = e.clientY - dragRef.current.startY;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const clamped = clampOffset(nx, ny, scaleRef.current, natRef.current);
      setOffset(clamped);
      offsetRef.current = clamped;
    });
  };

  const onPointerUp = () => { dragRef.current = null; };

  // ── Touch & wheel — attached directly to DOM with { passive: false } ────────
  // This is the ONLY way to call preventDefault() and stop the browser
  // from zooming / scrolling the page.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching.current = true;
        dragRef.current = null;
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        pinchRef.current = { dist: Math.hypot(dx, dy) };
      }
    };

    const handleTouchMove = (e) => {
      // Always prevent default while over the crop area to stop page zoom/scroll
      e.preventDefault();

      if (e.touches.length === 2 && pinchRef.current) {
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / pinchRef.current.dist;
        pinchRef.current = { dist };

        const ms      = getMinScale(natRef.current);
        const newScale = Math.max(ms, Math.min(4, scaleRef.current * ratio));
        const clamped  = clampOffset(offsetRef.current.x, offsetRef.current.y, newScale, natRef.current);

        scaleRef.current  = newScale;
        offsetRef.current = clamped;
        setScale(newScale);
        setOffset(clamped);
      } else if (e.touches.length === 1 && dragRef.current && !isPinching.current) {
        // Single-finger drag (also needs preventDefault to stop page scroll)
        const nx = e.touches[0].clientX - dragRef.current.startX;
        const ny = e.touches[0].clientY - dragRef.current.startY;
        const clamped = clampOffset(nx, ny, scaleRef.current, natRef.current);
        offsetRef.current = clamped;
        setOffset(clamped);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
        setTimeout(() => { isPinching.current = false; }, 80);
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const ms      = getMinScale(natRef.current);
      const newScale = Math.max(ms, Math.min(4, scaleRef.current * (1 - e.deltaY * 0.002)));
      const clamped  = clampOffset(offsetRef.current.x, offsetRef.current.y, newScale, natRef.current);
      scaleRef.current  = newScale;
      offsetRef.current = clamped;
      setScale(newScale);
      setOffset(clamped);
    };

    // { passive: false } is the critical flag — without it preventDefault() is a no-op
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    el.addEventListener('touchend',   handleTouchEnd,   { passive: false });
    el.addEventListener('wheel',      handleWheel,      { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove',  handleTouchMove);
      el.removeEventListener('touchend',   handleTouchEnd);
      el.removeEventListener('wheel',      handleWheel);
    };
  }, []); // mount/unmount only — handlers read everything via refs

  // ── Export crop ──────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const imgW = imgNatural.w * scale;
    const imgH = imgNatural.h * scale;
    const imgLeft = CROP_SIZE / 2 + offset.x - imgW / 2;
    const imgTop  = CROP_SIZE / 2 + offset.y - imgH / 2;
    const scaleX  = imgNatural.w / imgW;
    const scaleY  = imgNatural.h / imgH;
    const blob = await cropToBlob(
      imageSrc,
      { x: -imgLeft * scaleX, y: -imgTop * scaleY, w: CROP_SIZE * scaleX, h: CROP_SIZE * scaleY },
      { w: 400, h: 400 }
    );
    onConfirm(blob);
  };

  const imgW = imgNatural.w * scale;
  const imgH = imgNatural.h * scale;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      // Also block viewport-level pinch-zoom via CSS (belt-and-suspenders)
      touchAction: 'none',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Drag to position</p>

      <div
        ref={containerRef}
        style={{ position: 'relative', width: CROP_SIZE, height: CROP_SIZE, userSelect: 'none', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Clipped circle */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', cursor: 'grab' }}>
          <img
            src={imageSrc}
            draggable={false}
            style={{
              position: 'absolute',
              width:  imgW,
              height: imgH,
              left: CROP_SIZE / 2 + offset.x - imgW / 2,
              top:  CROP_SIZE / 2 + offset.y - imgH / 2,
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

  const [localFullName, setLocalFullName] = useState('');
  const [nameEditing,   setNameEditing]   = useState(false);
  const [nameSaving,    setNameSaving]    = useState(false);

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
    setCircleCrop({ src: URL.createObjectURL(file) });
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
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNameSave = async () => {
    setNameSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({ display_name: localFullName.trim() });
      setNameEditing(false);
    } catch (err) {
      console.error('[ProfileSettings] name save failed:', err);
      alert('Failed to save name — ' + (err?.message || 'unknown error'));
    } finally {
      setNameSaving(false);
    }
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
                  <button onClick={handleNameCancel} style={{ position: 'relative', zIndex: 1, width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(to bottom, #1e2535 0%, #0f1520 100%)', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 0 0 #0a0f1a, inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                    Cancel
                  </button>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#1a3fa8', transform: 'translateY(4px)' }} />
                  <button onClick={handleNameSave} disabled={nameSaving || !localFullName.trim()} style={{ position: 'relative', zIndex: 1, width: '100%', padding: '10px 0', borderRadius: 12, border: 'none', background: nameSaving ? 'rgba(59,130,246,0.5)' : 'linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: nameSaving || !localFullName.trim() ? 'default' : 'pointer', boxShadow: nameSaving ? 'none' : '0 4px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)', opacity: !localFullName.trim() ? 0.5 : 1 }}>
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