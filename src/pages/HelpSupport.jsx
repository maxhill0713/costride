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
    <div
      id={sectionId ? `section-${sectionId}` : undefined}
      style={{ background: GROUP_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 20, transition: 'box-shadow 0.4s ease', boxShadow: isHighlighted ? '0 0 0 2px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.2)' : 'none' }}
    >
      {children}
    </div>
  );
}

function Row({ label, sublabel, children, isLast, href }) {
  const inner = (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52, cursor: href ? 'pointer' : 'default' }}>
      {!isLast && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 12, color: '#475569', marginTop: 2, fontWeight: 500 }}>{sublabel}</div>}
      </div>
      {children
        ? <div style={{ flexShrink: 0 }}>{children}</div>
        : href && <ChevronRight style={{ width: 16, height: 16, color: '#475569', opacity: 0.5 }} />}
    </div>
  );
  if (href) return <a href={href} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>{inner}</a>;
  return inner;
}

function FaqItem({ question, answer, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', minHeight: 52, cursor: 'pointer', position: 'relative' }}
      >
        {!open && !isLast && <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 1, background: DIVIDER }} />}
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', letterSpacing: '-0.01em', flex: 1, paddingRight: 8 }}>{question}</span>
        <ChevronRight style={{ width: 16, height: 16, color: '#475569', opacity: 0.5, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </div>
      {open && (
        <>
          <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: '10px 16px 14px' }}>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{answer}</p>
          </div>
          {!isLast && <div style={{ height: 1, background: DIVIDER }} />}
        </>
      )}
    </div>
  );
}

export default function HelpSupport() {
  const highlighted = useSectionHighlight();

  const generalFaqs = [
    {
      q: 'How do I join a gym?',
      a: 'Tap the Gyms tab to browse or search for your gym. To join with an invite code, tap the "Join with Code" button in the top right of the Gyms page and enter the code your gym owner shared with you. Once you join, you\'ll see the gym\'s community feed.',
    },
    {
      q: 'How do I check in to the gym?',
      a: 'On the Home page, tap the blue Check In button at the top. This button only appears if you\'re a member of a gym and haven\'t already checked in today — it disappears once you\'ve checked in for the day.',
    },
    {
      q: 'How do I log a workout?',
      a: 'On the Home page, tap the Today\'s Workout card and hit Start Workout. Once you\'re done, press Finish and your workout will be saved to your progress. You need to have a workout split set up first — you can create one from the Home page.',
    },
    {
      q: 'How do I set up a workout split?',
      a: 'On the Home page, tap "Start Building" on the workout card, or go to Progress → Workout Split. From there you can create a weekly training schedule and assign exercises to each day.',
    },
  ];

  const streakFaqs = [
    {
      q: 'How does the streak work?',
      a: 'Your streak increases by one each day you log a workout using the Today\'s Workout card on the Home page. If you miss a training day from your split without logging, your streak resets to zero. Rest days are different — if a day is marked as a rest day in your workout split, it won\'t increase your streak but it also won\'t break it. Note: simply checking in to the gym does not count towards your streak — you must log a workout.',
    },
    {
      q: 'How do I change my streak icon?',
      a: 'Tap the streak icon in the top left corner of the Home page. A picker will appear where you can choose from different icon designs. Your selected icon is also shown when you react to posts.',
    },
    {
      q: 'What are streak freezes?',
      a: 'Streak freezes protect your streak if you miss a training day unexpectedly. You can earn or purchase freezes — when one is active, a missed day uses the freeze instead of resetting your streak.',
    },
  ];

  const profileFaqs = [
    {
      q: 'How do I change my profile photo?',
      a: 'Go to Settings → Profile → Profile Picture and tap Change to upload a new photo from your camera roll.',
    },
    {
      q: 'How do I add friends?',
      a: 'On the Home page, tap the people icon in the top right corner. Then tap the + button to search for friends by name or email. Once your request is accepted, you\'ll see their activity in your social feed.',
    },
    {
      q: 'What are badges and how do I earn them?',
      a: 'Badges are awarded for hitting milestones like 10 check-ins, 50 check-ins, maintaining a 7-day streak, and more. Go to Progress → Rank to see all available badges, which ones you\'ve earned, and which are still locked. You can equip up to 3 badges to show on your profile.',
    },
    {
      q: 'How do I set a fitness goal?',
      a: 'Go to Progress → Goals and tap New Goal. You can set a target value, choose a unit, and track your progress over time. Goals can be marked as complete once you hit your target.',
    },
  ];

  const accountFaqs = [
    {
      q: 'How do I reset my password?',
      a: 'Go to Settings → Account → Change Password, enter your current password and your new one. Passwords must be at least 8 characters long.',
    },
    {
      q: 'How do I delete my account?',
      a: 'Go to Settings and scroll to the bottom. Tap Delete Account and confirm. This permanently removes your account, all check-ins, posts, and progress. If you\'re a gym owner, your gyms will also be deleted. This cannot be undone.',
    },
    {
      q: 'Is my data private?',
      a: 'You control your privacy in Settings → Privacy. With a public profile, other CoStride users can view your stats. Switch to private and only your gym members and accepted friends can see your activity.',
    },
  ];

  return (
    <PageShell title="Help & Support">

      <SectionLabel>Contact us</SectionLabel>
      <Group sectionId="contact" highlighted={highlighted}>
        <Row label="Email support" sublabel={SUPPORT_EMAIL} href={`mailto:${SUPPORT_EMAIL}`} isLast>
          <Mail style={{ width: 16, height: 16, color: '#60a5fa' }} />
        </Row>
      </Group>

      <SectionLabel>Getting started</SectionLabel>
      <Group highlighted={highlighted}>
        {generalFaqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} isLast={i === generalFaqs.length - 1} />
        ))}
      </Group>

      <SectionLabel>Streaks</SectionLabel>
      <Group highlighted={highlighted}>
        {streakFaqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} isLast={i === streakFaqs.length - 1} />
        ))}
      </Group>

      <SectionLabel>Profile & social</SectionLabel>
      <Group highlighted={highlighted}>
        {profileFaqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} isLast={i === profileFaqs.length - 1} />
        ))}
      </Group>

      <SectionLabel>Account</SectionLabel>
      <Group sectionId="faq" highlighted={highlighted}>
        {accountFaqs.map((faq, i) => (
          <FaqItem key={i} question={faq.q} answer={faq.a} isLast={i === accountFaqs.length - 1} />
        ))}
      </Group>

      <p style={{ fontSize: 12, color: '#334155', fontWeight: 500, padding: '0 4px', lineHeight: 1.6, textAlign: 'center' }}>
        Still stuck? Email us at {SUPPORT_EMAIL} — we typically respond within 24 hours.
      </p>

    </PageShell>
  );
}