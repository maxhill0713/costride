import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';

const PAGE_BG  = 'linear-gradient(135deg, #02040a 0%, #0d2360 50%, #02040a 100%)';
const GROUP_BG = 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)';
const DIVIDER  = 'rgba(255,255,255,0.06)';
const SUPPORT_EMAIL = 'support@gymfuel.app';

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

function Row({ label, sublabel, children, isLast, href, onClick }) {
  const inner = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52, cursor: href || onClick ? 'pointer' : 'default' }}>
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: '#475569', marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
      </div>
      {children
        ? <div style={{ flexShrink: 0 }}>{children}</div>
        : (href || onClick) && <ChevronRight style={{ width: 16, height: 16, color: '#475569', opacity: 0.5 }} />}
    </div>
  );
  if (href) return <a href={href} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{inner}</a>;
  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return inner;
}

// Expandable FAQ item
function FaqItem({ question, answer, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {!isLast && !open && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52, cursor: 'pointer' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em', flex: 1 }}>{question}</span>
        <ChevronRight style={{ width: 16, height: 16, color: '#475569', opacity: 0.5, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${DIVIDER}` }}>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0, paddingTop: 10 }}>{answer}</p>
        </div>
      )}
      {!isLast && open && <div style={{ height: 1, background: DIVIDER, margin: '0 0 0 16px' }} />}
    </div>
  );
}

export default function HelpSupport() {
  const highlighted = useSectionHighlight();

  const faqs = [
    { q: 'How do I reset my password?', a: 'Go to Settings → Account → Change Password and follow the steps to update your password.' },
    { q: 'How do I change my profile photo?', a: 'Go to Settings → Profile → Profile Picture and tap Change to upload a new photo.' },
    { q: 'How do I delete my account?', a: 'Go to Settings and scroll to the bottom. Tap Delete Account. This is permanent and cannot be undone.' },
    { q: 'How do I join a gym?', a: 'Tap the Gyms tab, search for your gym and tap Join, or ask your gym for their invite code.' },
    { q: 'How does the streak work?', a: 'Your streak increases each day you log a workout. Missing a day resets it to zero — so keep showing up!' },
  ];

  return (
    <PageShell title="Help & Support">

      <SectionLabel>Contact</SectionLabel>
      <Group sectionId="contact" highlighted={highlighted}>
        <Row label="Email support" sublabel={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}`} isLast>
          <Mail style={{ width: 16, height: 16, color: '#60a5fa' }} />
        </Row>
      </Group>

      <SectionLabel>Common questions</SectionLabel>
      <Group sectionId="faq" highlighted={highlighted}>
        {faqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} isLast={i === faqs.length - 1} />
        ))}
      </Group>

      <p style={{ fontSize: 12, color: '#334155', fontWeight: 500, padding: '0 4px', lineHeight: 1.6, textAlign: 'center' }}>
        We typically respond within 24 hours.
      </p>

    </PageShell>
  );
}