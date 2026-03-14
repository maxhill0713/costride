import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, Camera, User } from 'lucide-react';

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
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(2,4,10,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px' }}>
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

function SettingInput({ value, onChange, placeholder, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="text" value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${focused ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: disabled ? '#475569' : '#e2e8f0', fontSize: 14, padding: '9px 12px', outline: 'none', width: '100%', fontFamily: 'inherit', transition: 'border-color 0.2s', cursor: disabled ? 'not-allowed' : 'auto' }}
    />
  );
}

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const highlighted = useSectionHighlight();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [nameTimeout, setNameTimeout]         = useState(null);
  const [localFullName, setLocalFullName]     = useState('');

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  useEffect(() => { if (currentUser) setLocalFullName(currentUser.full_name || ''); }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings) => { await base44.auth.updateMe(settings); return base44.auth.me(); },
    onSuccess: (u) => { queryClient.setQueryData(['currentUser'], u); queryClient.invalidateQueries({ queryKey: ['currentUser'] }); queryClient.invalidateQueries({ queryKey: ['user'] }); },
  });

  const handleImageUpload = async (file, type) => {
    if (type === 'avatar') setUploadingAvatar(true); else setUploadingBanner(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateSettingsMutation.mutateAsync(type === 'avatar' ? { avatar_url: file_url } : { hero_image_url: file_url });
    } catch (e) { console.error('Upload failed:', e); }
    finally { if (type === 'avatar') setUploadingAvatar(false); else setUploadingBanner(false); }
  };

  if (!currentUser) return <PageShell title="Profile"><p style={{ color: '#475569', textAlign: 'center', paddingTop: 40 }}>Loading…</p></PageShell>;

  return (
    <PageShell title="Profile">

      {/* Avatar */}
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
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'avatar')} />
              <div style={{ padding: '7px 14px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploadingAvatar ? 'Uploading…' : 'Change'}
              </div>
            </label>
          </div>
        </Row>
      </Group>

      {/* Banner */}
      <SectionLabel>Banner image</SectionLabel>
      <Group sectionId="banner" highlighted={highlighted}>
        <Row label="Cover photo" sublabel="Displayed at the top of your profile" isLast>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentUser.hero_image_url && (
              <div style={{ width: 64, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                <img src={currentUser.hero_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'banner')} />
              <div style={{ padding: '7px 14px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#60a5fa', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {uploadingBanner ? 'Uploading…' : 'Change'}
              </div>
            </label>
          </div>
        </Row>
      </Group>

      {/* Name */}
      <SectionLabel>Display name</SectionLabel>
      <Group sectionId="name" highlighted={highlighted}>
        <div style={{ padding: '14px 16px' }}>
          <SettingInput
            value={localFullName}
            onChange={e => { const v = e.target.value; setLocalFullName(v); clearTimeout(nameTimeout); setNameTimeout(setTimeout(() => updateSettingsMutation.mutate({ full_name: v }), 800)); }}
            placeholder="Your full name"
          />
          <p style={{ fontSize: 12, color: '#475569', marginTop: 8, fontWeight: 500 }}>Auto-saves as you type</p>
        </div>
      </Group>

    </PageShell>
  );
}