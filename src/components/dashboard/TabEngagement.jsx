import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap, Bell, UserPlus, Trophy, Flame, Users, CheckCircle,
  Plus, Trash2, ToggleLeft, ToggleRight, ChevronRight,
  AlertTriangle, Star, Gift, Clock, Send, X, Edit3,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const T = {
  blue:   '#0ea5e9', green:  '#10b981', red:    '#ef4444',
  amber:  '#f59e0b', purple: '#8b5cf6', cyan:   '#06b6d4',
  text1:  '#f0f4f8', text2:  '#94a3b8', text3:  '#475569',
  border: 'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
  card:   '#0b1120', divider: 'rgba(255,255,255,0.05)',
};

const TRIGGERS = [
  { id: 'inactive_7',   icon: Clock,    color: T.amber,  label: 'Inactive 7 days',    description: 'Member hasn\'t visited in 7 days',         category: 'retention' },
  { id: 'inactive_14',  icon: AlertTriangle, color: T.red, label: 'Inactive 14 days', description: 'Member hasn\'t visited in 14 days',        category: 'retention' },
  { id: 'inactive_30',  icon: AlertTriangle, color: T.red, label: 'Inactive 30 days', description: 'Member hasn\'t visited in 30 days',        category: 'retention' },
  { id: 'new_member',   icon: UserPlus, color: T.green,  label: 'New member joined',  description: 'A new member joins the gym',               category: 'onboarding' },
  { id: 'first_return', icon: CheckCircle, color: T.green, label: 'First return visit', description: 'New member returns for a 2nd visit',      category: 'onboarding' },
  { id: 'streak_7',     icon: Flame,    color: T.amber,  label: '7-day streak',       description: 'Member hits a 7-day attendance streak',    category: 'milestones' },
  { id: 'streak_30',    icon: Flame,    color: T.red,    label: '30-day streak',      description: 'Member hits a 30-day attendance streak',   category: 'milestones' },
  { id: 'visits_10',    icon: Star,     color: T.purple, label: '10th visit',         description: 'Member completes their 10th check-in',     category: 'milestones' },
  { id: 'visits_50',    icon: Trophy,   color: T.amber,  label: '50th visit',         description: 'Member completes their 50th check-in',     category: 'milestones' },
  { id: 'visits_100',   icon: Trophy,   color: T.cyan,   label: '100th visit',        description: 'Member completes their 100th check-in',    category: 'milestones' },
  { id: 'freq_drop',    icon: AlertTriangle, color: T.amber, label: 'Frequency drop', description: 'Member visits 50% less than usual this month', category: 'retention' },
  { id: 'birthday',     icon: Gift,     color: T.purple, label: 'Birthday',           description: 'It\'s a member\'s birthday',               category: 'engagement' },
];

const MESSAGE_TEMPLATES = {
  inactive_7:   (gym, name) => `Hey ${name}! 👋 We've missed you at ${gym} this week. Your progress is waiting — come back and keep the momentum going.`,
  inactive_14:  (gym, name) => `${name}, it's been a couple of weeks since we've seen you at ${gym}. No judgement — just checking in. Even one session can restart the habit.`,
  inactive_30:  (gym, name) => `Hi ${name}, it's been a while! The doors at ${gym} are always open. Come back when you're ready — we'd love to see you.`,
  new_member:   (gym, name) => `Welcome to ${gym}, ${name}! 🎉 We're so glad you're here. Don't hesitate to ask any of our coaches for help — we want you to love it here.`,
  first_return: (gym, name) => `Great to see you back, ${name}! 💪 Coming back is the hardest part — you're building a real habit now. Keep it up!`,
  streak_7:     (gym, name) => `${name}, you're on fire! 🔥 7 days straight at ${gym} — that's a real streak. Keep going!`,
  streak_30:    (gym, name) => `${name}, 30 DAYS! 🏆 You've shown incredible consistency at ${gym}. You're an inspiration to the whole community.`,
  visits_10:    (gym, name) => `10 visits, ${name}! 🎯 You've officially made ${gym} part of your routine. Here's to the next 10!`,
  visits_50:    (gym, name) => `50 visits, ${name}! 🌟 That's a huge milestone. You're one of ${gym}'s most dedicated members.`,
  visits_100:   (gym, name) => `100 visits, ${name}! 👑 You're an absolute legend at ${gym}. Thank you for being part of our community.`,
  freq_drop:    (gym, name) => `Hey ${name}, we noticed you've been a bit quieter at ${gym} this month. Everything okay? Let us know if there's anything we can do.`,
  birthday:     (gym, name) => `Happy Birthday, ${name}! 🎂 From everyone at ${gym}, we hope you have an amazing day. See you on the gym floor!`,
};

const CATEGORIES = [
  { id: 'all',        label: 'All' },
  { id: 'retention',  label: 'Retention' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'engagement', label: 'Engagement' },
];

function SCard({ children, style = {}, accent }) {
  const c = accent || T.blue;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${c}28,transparent)`, pointerEvents: 'none' }} />
      {children}
    </div>
  );
}

function RuleEditor({ rule, gymName, onSave, onCancel }) {
  const trigger = TRIGGERS.find(t => t.id === rule.trigger_id);
  const defaultMsg = MESSAGE_TEMPLATES[rule.trigger_id]?.(gymName, '{name}') || '';
  const [message, setMessage] = useState(rule.message || defaultMsg);
  const [delay, setDelay]     = useState(rule.delay_hours || 0);

  return (
    <div style={{ padding: 20, background: `${T.blue}06`, border: `1px solid ${T.blue}22`, borderRadius: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {trigger && <trigger.icon style={{ width: 14, height: 14, color: trigger.color }} />}
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Edit Message</span>
        <span style={{ fontSize: 10, color: T.text3, background: T.divider, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px' }}>Use {'{name}'} for member name</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Message</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: T.divider, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text1, fontSize: 12, lineHeight: 1.65, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = `${T.blue}50`}
          onBlur={e => e.target.style.borderColor = T.border}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Send delay after trigger</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 3, 6, 24].map(h => (
            <button key={h} onClick={() => setDelay(h)}
              style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: delay === h ? `${T.blue}18` : T.divider, color: delay === h ? T.blue : T.text2, border: `1px solid ${delay === h ? T.blue + '40' : T.border}`, transition: 'all 0.12s' }}>
              {h === 0 ? 'Instantly' : h === 1 ? '1 hr' : h === 24 ? '1 day' : `${h} hrs`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave({ message, delay_hours: delay })}
          style={{ flex: 1, padding: '8px', borderRadius: 8, background: T.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <CheckCircle style={{ width: 13, height: 13 }} /> Save Rule
        </button>
        <button onClick={onCancel}
          style={{ padding: '8px 16px', borderRadius: 8, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RuleCard({ rule, gymName, onToggle, onEdit, onDelete, onTestSend }) {
  const trigger = TRIGGERS.find(t => t.id === rule.trigger_id);
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  if (!trigger) return null;

  const handleTest = async () => {
    setSending(true);
    try {
      await onTestSend(rule);
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } finally { setSending(false); }
  };

  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${rule.enabled ? T.border : 'rgba(255,255,255,0.04)'}`, opacity: rule.enabled ? 1 : 0.55, transition: 'opacity 0.2s', overflow: 'hidden' }}>
      {/* Accent bar */}
      <div style={{ height: 2, background: rule.enabled ? `linear-gradient(90deg,${trigger.color}cc,${trigger.color}44)` : T.divider }} />

      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${trigger.color}14`, border: `1px solid ${trigger.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <trigger.icon style={{ width: 16, height: 16, color: trigger.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>{trigger.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: trigger.color, background: `${trigger.color}14`, border: `1px solid ${trigger.color}22`, borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{trigger.category}</span>
          </div>
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rule.message || MESSAGE_TEMPLATES[rule.trigger_id]?.(gymName, '{name}')}
          </div>
          {rule.delay_hours > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <Clock style={{ width: 9, height: 9, color: T.text3 }} />
              <span style={{ fontSize: 10, color: T.text3 }}>Sends {rule.delay_hours === 1 ? '1 hour' : rule.delay_hours === 24 ? '1 day' : `${rule.delay_hours} hours`} after trigger</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button onClick={handleTest} disabled={sending || sent}
            style={{ padding: '5px 10px', borderRadius: 7, background: sent ? `${T.green}14` : T.divider, border: `1px solid ${sent ? T.green + '30' : T.border}`, color: sent ? T.green : T.text3, fontSize: 10, fontWeight: 700, cursor: sending || sent ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
            {sent ? <><CheckCircle style={{ width: 9, height: 9 }} /> Sent</> : <><Send style={{ width: 9, height: 9 }} /> Test</>}
          </button>
          <button onClick={() => setExpanded(v => !v)}
            style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, color: T.text3, cursor: 'pointer' }}>
            <Edit3 style={{ width: 11, height: 11 }} />
          </button>
          <button onClick={onToggle}
            style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: rule.enabled ? `${T.green}14` : T.divider, border: `1px solid ${rule.enabled ? T.green + '30' : T.border}`, color: rule.enabled ? T.green : T.text3, cursor: 'pointer', transition: 'all 0.15s' }}>
            {rule.enabled ? <ToggleRight style={{ width: 13, height: 13 }} /> : <ToggleLeft style={{ width: 13, height: 13 }} />}
          </button>
          <button onClick={onDelete}
            style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, color: T.text3, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${T.red}14`; e.currentTarget.style.color = T.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.divider; e.currentTarget.style.color = T.text3; }}>
            <Trash2 style={{ width: 11, height: 11 }} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <RuleEditor
            rule={rule}
            gymName={gymName}
            onSave={updates => { onEdit(updates); setExpanded(false); }}
            onCancel={() => setExpanded(false)}
          />
        </div>
      )}
    </div>
  );
}

function AddRulePanel({ gymName, existingTriggerIds, onAdd, onClose }) {
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [message, setMessage]   = useState('');
  const [delay, setDelay]       = useState(0);

  const available = TRIGGERS.filter(t =>
    (category === 'all' || t.category === category) &&
    !existingTriggerIds.includes(t.id)
  );

  const handleSelect = (t) => {
    setSelected(t);
    setMessage(MESSAGE_TEMPLATES[t.id]?.(gymName, '{name}') || '');
  };

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>Add Automation Rule</div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, color: T.text3, cursor: 'pointer' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: category === c.id ? `${T.blue}18` : T.divider, color: category === c.id ? T.blue : T.text2, border: `1px solid ${category === c.id ? T.blue + '40' : T.border}`, transition: 'all 0.12s' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Trigger picker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {available.map(t => (
          <button key={t.id} onClick={() => handleSelect(t)}
            style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', background: selected?.id === t.id ? `${t.color}12` : T.divider, border: `1px solid ${selected?.id === t.id ? t.color + '45' : T.border}`, transition: 'all 0.12s', display: 'flex', alignItems: 'flex-start', gap: 10 }}
            onMouseEnter={e => { if (selected?.id !== t.id) e.currentTarget.style.borderColor = `${t.color}30`; }}
            onMouseLeave={e => { if (selected?.id !== t.id) e.currentTarget.style.borderColor = T.border; }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${t.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <t.icon style={{ width: 13, height: 13, color: t.color }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: selected?.id === t.id ? t.color : T.text1, marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: T.text3, lineHeight: 1.4 }}>{t.description}</div>
            </div>
          </button>
        ))}
        {available.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '24px', textAlign: 'center', color: T.text3, fontSize: 12 }}>All rules in this category are already active.</div>
        )}
      </div>

      {selected && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Message <span style={{ fontWeight: 500, color: T.text3 }}>— use {'{name}'} for member name</span></div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: T.divider, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text1, fontSize: 12, lineHeight: 1.65, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = `${T.blue}50`}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Send delay</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 3, 6, 24].map(h => (
                <button key={h} onClick={() => setDelay(h)}
                  style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: delay === h ? `${T.blue}18` : T.divider, color: delay === h ? T.blue : T.text2, border: `1px solid ${delay === h ? T.blue + '40' : T.border}`, transition: 'all 0.12s' }}>
                  {h === 0 ? 'Instantly' : h === 1 ? '1 hr' : h === 24 ? '1 day' : `${h} hrs`}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { if (message.trim()) { onAdd({ trigger_id: selected.id, message: message.trim(), delay_hours: delay, enabled: true }); onClose(); } }}
            disabled={!message.trim()}
            style={{ width: '100%', padding: '10px', borderRadius: 9, background: T.blue, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: message.trim() ? 'pointer' : 'default', opacity: message.trim() ? 1 : 0.5, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Plus style={{ width: 14, height: 14 }} /> Add Rule
          </button>
        </>
      )}
    </div>
  );
}

const STATS_EXAMPLES = [
  { label: 'Avg open rate', value: '68%', sub: 'Push notifications', color: T.blue },
  { label: 'Re-engagement', value: '23%', sub: 'Inactive members return', color: T.green },
  { label: 'Week-1 boost',  value: '41%', sub: 'More 2nd visits', color: T.amber },
];

export default function TabEngagement({ selectedGym, allMemberships, atRisk, totalMembers }) {
  const gymName = selectedGym?.name || 'Your Gym';

  // Rules stored in local state (persisted to Gym entity via gym.automation_rules)
  const [rules, setRules] = useState(() => {
    const saved = selectedGym?.automation_rules;
    if (saved && Array.isArray(saved)) return saved;
    // Sensible defaults — new-member welcome + inactive 14-day are pre-enabled
    return [
      { id: 'r_new',   trigger_id: 'new_member',  message: MESSAGE_TEMPLATES.new_member(gymName, '{name}'),  delay_hours: 0,  enabled: true },
      { id: 'r_14',    trigger_id: 'inactive_14', message: MESSAGE_TEMPLATES.inactive_14(gymName, '{name}'), delay_hours: 1,  enabled: true },
      { id: 'r_str7',  trigger_id: 'streak_7',    message: MESSAGE_TEMPLATES.streak_7(gymName, '{name}'),    delay_hours: 0,  enabled: false },
      { id: 'r_v10',   trigger_id: 'visits_10',   message: MESSAGE_TEMPLATES.visits_10(gymName, '{name}'),   delay_hours: 0,  enabled: false },
    ];
  });

  const [showAdd,  setShowAdd]  = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const enabledCount  = rules.filter(r => r.enabled).length;
  const existingIds   = rules.map(r => r.trigger_id);

  const persistRules = async (updated) => {
    if (!selectedGym?.id) return;
    setIsSaving(true);
    try {
      await base44.entities.Gym.update(selectedGym.id, { automation_rules: updated });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } finally { setIsSaving(false); }
  };

  const addRule = (rule) => {
    const updated = [...rules, { ...rule, id: `r_${Date.now()}` }];
    setRules(updated);
    persistRules(updated);
  };

  const toggleRule = (id) => {
    const updated = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    persistRules(updated);
  };

  const editRule = (id, updates) => {
    const updated = rules.map(r => r.id === id ? { ...r, ...updates } : r);
    setRules(updated);
    persistRules(updated);
  };

  const deleteRule = (id) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    persistRules(updated);
  };

  const testSend = async (rule) => {
    if (!selectedGym?.id) return;
    const previewMsg = (rule.message || '').replace('{name}', 'you');
    const me = await base44.auth.me();
    await base44.functions.invoke('sendPushNotification', {
      gym_id: selectedGym.id,
      gym_name: gymName,
      member_ids: [me.id],
      message: `[TEST] ${previewMsg}`,
    });
  };

  const enabledRules   = rules.filter(r => r.enabled);
  const disabledRules  = rules.filter(r => !r.enabled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${T.blue}14`, border: `1px solid ${T.blue}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap style={{ width: 15, height: 15, color: T.blue }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text1, margin: 0, letterSpacing: '-0.03em' }}>Automated Engagement</h2>
          </div>
          <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>Set up rules to automatically message members based on their behaviour — no manual work needed.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {savedMsg && <span style={{ fontSize: 11, fontWeight: 700, color: T.green, background: `${T.green}12`, border: `1px solid ${T.green}28`, borderRadius: 7, padding: '5px 10px' }}>✓ Saved</span>}
          {isSaving && <span style={{ fontSize: 11, color: T.text3 }}>Saving…</span>}
          <button onClick={() => setShowAdd(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, background: T.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 0 0 ${T.blue}` }}>
            <Plus style={{ width: 13, height: 13 }} /> Add Rule
          </button>
        </div>
      </div>

      {/* ── Stats banner ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
        {STATS_EXAMPLES.map((s, i) => (
          <SCard key={i} accent={s.color} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.05em', lineHeight: 1 }}>{s.value}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: T.text3 }}>{s.sub}</div>
            </div>
          </SCard>
        ))}
      </div>

      {/* ── Add rule panel ── */}
      {showAdd && (
        <AddRulePanel gymName={gymName} existingTriggerIds={existingIds} onAdd={addRule} onClose={() => setShowAdd(false)} />
      )}

      {/* ── Active rules ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Active Rules</div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: `${T.green}12`, border: `1px solid ${T.green}25`, borderRadius: 99, padding: '2px 8px' }}>{enabledCount} running</span>
        </div>
        {enabledRules.length === 0 ? (
          <SCard style={{ padding: 24, textAlign: 'center' }}>
            <Zap style={{ width: 24, height: 24, color: T.text3, margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text3, marginBottom: 4 }}>No active rules yet</div>
            <div style={{ fontSize: 11, color: T.text3, opacity: 0.7 }}>Add your first rule to start automating member engagement.</div>
          </SCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enabledRules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                gymName={gymName}
                onToggle={() => toggleRule(rule.id)}
                onEdit={updates => editRule(rule.id, updates)}
                onDelete={() => deleteRule(rule.id)}
                onTestSend={testSend}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Inactive rules ── */}
      {disabledRules.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text3, marginBottom: 12 }}>Inactive Rules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {disabledRules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                gymName={gymName}
                onToggle={() => toggleRule(rule.id)}
                onEdit={updates => editRule(rule.id, updates)}
                onDelete={() => deleteRule(rule.id)}
                onTestSend={testSend}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Impact summary ── */}
      <SCard accent={T.purple} style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Bell style={{ width: 14, height: 14, color: T.purple }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Who will these rules reach?</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Total members',  value: totalMembers || 0, color: T.blue   },
            { label: 'At-risk',        value: atRisk || 0,       color: T.red    },
            { label: 'Active rules',   value: enabledCount,      color: T.green  },
            { label: 'Triggers set',   value: rules.length,      color: T.purple },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: T.divider, border: `1px solid ${T.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 9, background: `${T.purple}0a`, border: `1px solid ${T.purple}18`, fontSize: 11, color: T.text3, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 700, color: T.text2 }}>How it works:</span> When a trigger fires (e.g. a member goes 14 days without a visit), we automatically send them a push notification using your custom message. Responses and re-engagements show up in your Members tab.
        </div>
      </SCard>
    </div>
  );
}