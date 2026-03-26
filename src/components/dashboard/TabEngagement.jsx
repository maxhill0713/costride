import React, { useState } from 'react';
import {
  Zap, Bell, UserPlus, Trophy, Flame, Users, CheckCircle,
  Plus, Trash2, ChevronRight, AlertTriangle, Star, Gift,
  Clock, Send, X, Edit3, ToggleLeft, ToggleRight, ArrowRight,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ── Trigger definitions ───────────────────────────────────────── */
const TRIGGERS = [
  { id:'inactive_7',  Icon:Clock,         cat:'Retention',   label:'Inactive 7 days',     desc:"Member hasn't visited in 7 days" },
  { id:'inactive_14', Icon:AlertTriangle, cat:'Retention',   label:'Inactive 14 days',    desc:"Member hasn't visited in 14 days" },
  { id:'inactive_30', Icon:AlertTriangle, cat:'Retention',   label:'Inactive 30 days',    desc:"Member hasn't visited in 30 days" },
  { id:'freq_drop',   Icon:AlertTriangle, cat:'Retention',   label:'Frequency drop',      desc:'Visits 50% less than usual this month' },
  { id:'new_member',  Icon:UserPlus,      cat:'Onboarding',  label:'New member joined',   desc:'A new member joins the gym' },
  { id:'first_return',Icon:CheckCircle,   cat:'Onboarding',  label:'First return visit',  desc:'New member returns for a 2nd visit' },
  { id:'streak_7',    Icon:Flame,         cat:'Milestones',  label:'7-day streak',        desc:'Member hits a 7-day attendance streak' },
  { id:'streak_30',   Icon:Flame,         cat:'Milestones',  label:'30-day streak',       desc:'Member hits a 30-day attendance streak' },
  { id:'visits_10',   Icon:Star,          cat:'Milestones',  label:'10th visit',          desc:'Member completes their 10th check-in' },
  { id:'visits_50',   Icon:Trophy,        cat:'Milestones',  label:'50th visit',          desc:'Member completes their 50th check-in' },
  { id:'visits_100',  Icon:Trophy,        cat:'Milestones',  label:'100th visit',         desc:'Member completes their 100th check-in' },
  { id:'birthday',    Icon:Gift,          cat:'Engagement',  label:'Birthday',            desc:"It's a member's birthday" },
];

const TEMPLATES = {
  inactive_7:   (g,n) => `Hey ${n}, we've missed you at ${g} this week. Your progress is waiting — come back and keep the momentum going.`,
  inactive_14:  (g,n) => `${n}, it's been a couple of weeks since we've seen you at ${g}. No judgement — just checking in. Even one session can restart the habit.`,
  inactive_30:  (g,n) => `Hi ${n}, it's been a while. The doors at ${g} are always open whenever you're ready.`,
  new_member:   (g,n) => `Welcome to ${g}, ${n}. We're glad you're here. Don't hesitate to ask any of our coaches for help — we want you to love it here.`,
  first_return: (g,n) => `Great to see you back, ${n}. Coming back is the hardest part — you're building a real habit now.`,
  streak_7:     (g,n) => `${n}, 7 days straight at ${g}. That's a genuine streak. Keep going.`,
  streak_30:    (g,n) => `${n}, 30 days. You've shown incredible consistency at ${g}. You're an inspiration to the whole community.`,
  visits_10:    (g,n) => `10 visits, ${n}. You've officially made ${g} part of your routine.`,
  visits_50:    (g,n) => `50 visits, ${n}. That's a huge milestone. You're one of ${g}'s most dedicated members.`,
  visits_100:   (g,n) => `100 visits, ${n}. You're an absolute legend at ${g}. Thank you for being part of our community.`,
  freq_drop:    (g,n) => `Hey ${n}, we noticed you've been a bit quieter at ${g} this month. Everything okay? Let us know if there's anything we can do.`,
  birthday:     (g,n) => `Happy Birthday, ${n}. From everyone at ${g}, we hope you have an amazing day.`,
};

const CATS = ['All','Retention','Onboarding','Milestones','Engagement'];

const DELAY_OPTS = [
  { v:0, label:'Immediately' }, { v:1, label:'1 hour' },
  { v:3, label:'3 hours' }, { v:6, label:'6 hours' }, { v:24, label:'24 hours' },
];

/* ── Shared primitives ─────────────────────────────────────────── */
function Card({ children, style={} }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:CARD_RADIUS,
      boxShadow:CARD_SHADOW, overflow:'hidden', position:'relative', ...style }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{children}</div>;
}

function DelayPicker({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
      {DELAY_OPTS.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{ padding:'5px 12px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            background: value===o.v ? C.accentSub : 'rgba(255,255,255,0.03)',
            color: value===o.v ? C.accent : C.t3,
            border:`1px solid ${value===o.v ? C.accentBrd : C.border}`,
            transition:'all .14s' }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Rule editor ───────────────────────────────────────────────── */
function RuleEditor({ rule, gymName, onSave, onCancel }) {
  const [msg, setMsg] = useState(rule.message || TEMPLATES[rule.trigger_id]?.(gymName,'{name}') || '');
  const [delay, setDelay] = useState(rule.delay_hours || 0);

  return (
    <div style={{ padding:'16px 18px 18px', borderTop:`1px solid ${C.border}`, background:C.bg }}>
      <Label>Message — use {'{name}'} for member's first name</Label>
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3}
        style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px',
          background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`,
          borderRadius:9, color:C.t1, fontSize:12, lineHeight:1.65,
          resize:'vertical', outline:'none', fontFamily:'inherit', marginBottom:14 }}
        onFocus={e=>e.target.style.borderColor=C.accentBrd}
        onBlur={e=>e.target.style.borderColor=C.border} />

      <Label>Send delay after trigger</Label>
      <div style={{ marginBottom:16 }}><DelayPicker value={delay} onChange={setDelay} /></div>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onSave({ message:msg, delay_hours:delay })}
          style={{ flex:1, height:36, borderRadius:8, background:C.accent, color:'#fff', border:'none',
            fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <CheckCircle style={{ width:12, height:12 }} /> Save changes
        </button>
        <button onClick={onCancel}
          style={{ height:36, padding:'0 14px', borderRadius:8, background:'rgba(255,255,255,0.04)',
            color:C.t2, border:`1px solid ${C.border}`, fontSize:12, fontWeight:600,
            cursor:'pointer', fontFamily:'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Rule card ─────────────────────────────────────────────────── */
function RuleCard({ rule, gymName, onToggle, onEdit, onDelete, onTestSend }) {
  const trig = TRIGGERS.find(t => t.id === rule.trigger_id);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!trig) return null;

  const handleTest = async () => {
    setSending(true);
    try { await onTestSend(rule); setSent(true); setTimeout(()=>setSent(false), 2500); }
    finally { setSending(false); }
  };

  const IconEl = trig.Icon;

  return (
    <div style={{ background:C.surface, border:`1px solid ${rule.enabled ? C.border : 'rgba(255,255,255,0.04)'}`,
      borderRadius:13, overflow:'hidden', opacity:rule.enabled ? 1 : 0.5,
      transition:'opacity .2s, border-color .2s', boxShadow:CARD_SHADOW }}>

      <div style={{ height:1.5, background: rule.enabled
        ? `linear-gradient(90deg, ${C.accent}80 0%, ${C.accent}18 60%, transparent 100%)`
        : 'rgba(255,255,255,0.04)' }} />

      <div style={{ padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
          background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IconEl style={{ width:15, height:15, color: rule.enabled ? C.t2 : C.t3 }} />
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
            <span style={{ fontSize:13, fontWeight:700, color: rule.enabled ? C.t1 : C.t2 }}>{trig.label}</span>
            <span style={{ fontSize:9, fontWeight:700, color:C.t3, background:'rgba(255,255,255,0.05)',
              border:`1px solid ${C.border}`, borderRadius:5, padding:'1.5px 7px',
              textTransform:'uppercase', letterSpacing:'.06em' }}>{trig.cat}</span>
          </div>
          <div style={{ fontSize:11, color:C.t3, overflow:'hidden', textOverflow:'ellipsis',
            whiteSpace:'nowrap', lineHeight:1.45 }}>
            {(rule.message || TEMPLATES[rule.trigger_id]?.(gymName,'{name}') || '').replace('{name}','Member')}
          </div>
          {rule.delay_hours > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
              <Clock style={{ width:9, height:9, color:C.t4 }} />
              <span style={{ fontSize:10, color:C.t4 }}>
                {rule.delay_hours === 1 ? '1 hour' : rule.delay_hours === 24 ? '24 hours' : `${rule.delay_hours} hours`} after trigger
              </span>
            </div>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <button onClick={handleTest} disabled={sending||sent}
            style={{ height:28, padding:'0 10px', borderRadius:7,
              background: sent ? C.successSub : 'rgba(255,255,255,0.04)',
              border:`1px solid ${sent ? C.successBrd : C.border}`,
              color: sent ? C.success : C.t3,
              fontSize:10, fontWeight:700, cursor: sending||sent ? 'default' : 'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:4,
              transition:'all .14s' }}>
            {sent ? <><CheckCircle style={{ width:9,height:9 }} />Sent</> : <><Send style={{ width:9,height:9 }} />Test</>}
          </button>

          <button onClick={() => setOpen(v=>!v)}
            style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
              background: open ? C.accentSub : 'rgba(255,255,255,0.04)',
              border:`1px solid ${open ? C.accentBrd : C.border}`,
              color: open ? C.accent : C.t3, cursor:'pointer', transition:'all .14s' }}>
            <Edit3 style={{ width:11, height:11 }} />
          </button>

          <button onClick={onToggle}
            style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
              background: rule.enabled ? C.successSub : 'rgba(255,255,255,0.04)',
              border:`1px solid ${rule.enabled ? C.successBrd : C.border}`,
              color: rule.enabled ? C.success : C.t3, cursor:'pointer', transition:'all .14s' }}>
            {rule.enabled ? <ToggleRight style={{ width:13, height:13 }} /> : <ToggleLeft style={{ width:13, height:13 }} />}
          </button>

          <button onClick={onDelete}
            style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
              color:C.t3, cursor:'pointer', transition:'all .14s' }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.dangerSub;e.currentTarget.style.borderColor=C.dangerBrd;e.currentTarget.style.color=C.danger;}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.t3;}}>
            <Trash2 style={{ width:11, height:11 }} />
          </button>
        </div>
      </div>

      {open && (
        <RuleEditor rule={rule} gymName={gymName}
          onSave={u => { onEdit(u); setOpen(false); }}
          onCancel={() => setOpen(false)} />
      )}
    </div>
  );
}

/* ── Add rule panel ────────────────────────────────────────────── */
function AddRulePanel({ gymName, existingIds, onAdd, onClose }) {
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState('');
  const [delay, setDelay] = useState(0);

  const available = TRIGGERS.filter(t => (cat === 'All' || t.cat === cat) && !existingIds.includes(t.id));
  const pick = t => { setSelected(t); setMsg(TEMPLATES[t.id]?.(gymName,'{name}') || ''); };

  return (
    <Card>
      <div style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:C.t0, marginBottom:2 }}>New automation rule</div>
          <div style={{ fontSize:12, color:C.t3 }}>Choose a trigger, write a message, set timing.</div>
        </div>
        <button onClick={onClose} style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, color:C.t3, cursor:'pointer' }}>
          <X style={{ width:12, height:12 }} />
        </button>
      </div>

      <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:20 }}>
        <div>
          <div style={{ display:'flex', gap:4, marginBottom:14, flexWrap:'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit',
                  background: cat===c ? C.accentSub : 'rgba(255,255,255,0.03)',
                  color: cat===c ? C.accent : C.t3,
                  border:`1px solid ${cat===c ? C.accentBrd : C.border}`,
                  transition:'all .14s' }}>
                {c}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {available.map(t => {
              const IconEl = t.Icon;
              const isSel = selected?.id === t.id;
              return (
                <button key={t.id} onClick={() => pick(t)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    borderRadius:10, cursor:'pointer', textAlign:'left', fontFamily:'inherit',
                    background: isSel ? C.accentSub : 'rgba(255,255,255,0.025)',
                    border:`1px solid ${isSel ? C.accentBrd : C.border}`,
                    transition:'all .13s' }}
                  onMouseEnter={e=>{ if(!isSel){ e.currentTarget.style.background='rgba(255,255,255,0.045)'; e.currentTarget.style.borderColor=C.borderEl; }}}
                  onMouseLeave={e=>{ if(!isSel){ e.currentTarget.style.background='rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor=C.border; }}}>
                  <div style={{ width:28, height:28, borderRadius:8, flexShrink:0,
                    background: isSel ? C.accentSub : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${isSel ? C.accentBrd : C.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <IconEl style={{ width:12, height:12, color: isSel ? C.accent : C.t3 }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color: isSel ? C.t1 : C.t2, marginBottom:1 }}>{t.label}</div>
                    <div style={{ fontSize:10, color:C.t3, lineHeight:1.4 }}>{t.desc}</div>
                  </div>
                  {isSel && <ChevronRight style={{ width:12, height:12, color:C.accent, flexShrink:0 }} />}
                </button>
              );
            })}
            {available.length === 0 && (
              <div style={{ padding:'20px', textAlign:'center', color:C.t3, fontSize:12 }}>
                All rules in this category are already active.
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div>
            <div style={{ padding:'12px 14px', borderRadius:10, background:C.accentSub,
              border:`1px solid ${C.accentBrd}`, marginBottom:16,
              display:'flex', alignItems:'center', gap:9 }}>
              {(() => { const I = selected.Icon; return <I style={{ width:13, height:13, color:C.accent, flexShrink:0 }} />; })()}
              <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{selected.label}</span>
            </div>

            <Label>Message — use {'{name}'} for first name</Label>
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4}
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px',
                background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`,
                borderRadius:9, color:C.t1, fontSize:12, lineHeight:1.65,
                resize:'vertical', outline:'none', fontFamily:'inherit', marginBottom:14 }}
              onFocus={e=>e.target.style.borderColor=C.accentBrd}
              onBlur={e=>e.target.style.borderColor=C.border} />

            <Label>Send timing</Label>
            <div style={{ marginBottom:18 }}><DelayPicker value={delay} onChange={setDelay} /></div>

            <button onClick={() => { if(msg.trim()){ onAdd({trigger_id:selected.id,message:msg.trim(),delay_hours:delay,enabled:true}); onClose(); }}}
              disabled={!msg.trim()}
              style={{ width:'100%', height:40, borderRadius:9,
                background: msg.trim() ? C.accent : 'rgba(255,255,255,0.06)',
                color: msg.trim() ? '#fff' : C.t3,
                border:'none', fontSize:13, fontWeight:700,
                cursor: msg.trim() ? 'pointer' : 'default', fontFamily:'inherit',
                display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                transition:'background .15s' }}>
              <Plus style={{ width:13, height:13 }} /> Add rule
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const testSendCooldowns = {};
const TEST_SEND_COOLDOWN_MS = 10_000;

export default function TabEngagement({ selectedGym, allMemberships, atRisk, totalMembers }) {
  const gymName = selectedGym?.name || 'Your Gym';

  const [rules, setRules] = useState(() => {
    const saved = selectedGym?.automation_rules;
    if (saved && Array.isArray(saved)) return saved;
    return [
      { id:'r_new',  trigger_id:'new_member',  message:TEMPLATES.new_member(gymName,'{name}'),  delay_hours:0, enabled:true },
      { id:'r_14',   trigger_id:'inactive_14', message:TEMPLATES.inactive_14(gymName,'{name}'), delay_hours:1, enabled:true },
      { id:'r_str7', trigger_id:'streak_7',    message:TEMPLATES.streak_7(gymName,'{name}'),    delay_hours:0, enabled:false },
      { id:'r_v10',  trigger_id:'visits_10',   message:TEMPLATES.visits_10(gymName,'{name}'),   delay_hours:0, enabled:false },
    ];
  });

  const [showAdd, setShowAdd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const enabledCount = rules.filter(r => r.enabled).length;
  const existingIds = rules.map(r => r.trigger_id);
  const enabledRules = rules.filter(r => r.enabled);
  const pausedRules = rules.filter(r => !r.enabled);

  const persist = async updated => {
    if (!selectedGym?.id) return;
    setIsSaving(true);
    try {
      await base44.entities.Gym.update(selectedGym.id, { automation_rules: updated });
      setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2500);
    } finally { setIsSaving(false); }
  };

  const addRule = r => { const u=[...rules,{...r,id:`r_${Date.now()}`}]; setRules(u); persist(u); };
  const toggleRule = id => { const u=rules.map(r=>r.id===id?{...r,enabled:!r.enabled}:r); setRules(u); persist(u); };
  const editRule = (id,updates) => { const u=rules.map(r=>r.id===id?{...r,...updates}:r); setRules(u); persist(u); };
  const deleteRule = id => { const u=rules.filter(r=>r.id!==id); setRules(u); persist(u); };

  const testSend = async rule => {
    if (!selectedGym?.id) return;
    const lastSent = testSendCooldowns[rule.id] || 0;
    if (Date.now() - lastSent < TEST_SEND_COOLDOWN_MS) return;
    testSendCooldowns[rule.id] = Date.now();
    const msg = (rule.message||'').replace('{name}','you');
    const me = await base44.auth.me();
    await base44.functions.invoke('sendPushNotification',{
      gym_id: selectedGym.id, gym_name: gymName,
      member_ids: [me.id], message: `[TEST] ${msg}`,
    });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Page header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800, color:C.t0, margin:'0 0 5px',
            letterSpacing:'-0.03em', display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:C.accentSub, border:`1px solid ${C.accentBrd}`,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Zap style={{ width:14, height:14, color:C.accent }} />
            </div>
            Automated Engagement
          </h2>
          <p style={{ fontSize:13, color:C.t3, margin:0, maxWidth:480, lineHeight:1.6 }}>
            Set up rules to automatically message members based on their behaviour.
            Runs in the background — no manual work required.
          </p>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {savedMsg && (
            <span style={{ fontSize:11, fontWeight:700, color:C.success,
              background:C.successSub, border:`1px solid ${C.successBrd}`,
              borderRadius:7, padding:'5px 10px' }}>
              Saved
            </span>
          )}
          {isSaving && <span style={{ fontSize:11, color:C.t3 }}>Saving</span>}
          <button onClick={() => setShowAdd(v=>!v)}
            style={{ display:'flex', alignItems:'center', gap:7, height:36, padding:'0 14px',
              borderRadius:9, background: showAdd ? C.accentSub : C.accent,
              color: showAdd ? C.accent : '#fff',
              border:`1px solid ${showAdd ? C.accentBrd : 'transparent'}`,
              fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              transition:'all .15s' }}>
            <Plus style={{ width:13, height:13 }} />
            {showAdd ? 'Cancel' : 'Add rule'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        {[
          { label:'Total members',   value: totalMembers || 0, sub:'enrolled' },
          { label:'At-risk members', value: atRisk || 0,       sub:'need attention', risk:true },
          { label:'Active rules',    value: enabledCount,      sub:'running now' },
          { label:'Avg. open rate',  value:'68%',              sub:'push notifications' },
        ].map((s,i) => (
          <Card key={i} style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.04em', lineHeight:1, marginBottom:5,
              color: s.risk && s.value > 0 ? C.danger : C.t0, fontVariantNumeric:'tabular-nums' }}>
              {s.value}
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:C.t2, marginBottom:1 }}>{s.label}</div>
            <div style={{ fontSize:11, color:C.t3 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <AddRulePanel gymName={gymName} existingIds={existingIds} onAdd={addRule} onClose={() => setShowAdd(false)} />
      )}

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>

        {/* Left column */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>Active</span>
                <span style={{ fontSize:10, fontWeight:700, color:C.success,
                  background:C.successSub, border:`1px solid ${C.successBrd}`,
                  borderRadius:99, padding:'2px 9px' }}>
                  {enabledCount} running
                </span>
              </div>
            </div>

            {enabledRules.length === 0 ? (
              <Card style={{ padding:'32px 24px', textAlign:'center' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.04)',
                  border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 12px' }}>
                  <Zap style={{ width:18, height:18, color:C.t3 }} />
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:C.t2, marginBottom:4 }}>No active rules</div>
                <div style={{ fontSize:12, color:C.t3 }}>Add your first rule to start automating member engagement.</div>
              </Card>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {enabledRules.map(rule => (
                  <RuleCard key={rule.id} rule={rule} gymName={gymName}
                    onToggle={() => toggleRule(rule.id)} onEdit={u => editRule(rule.id, u)}
                    onDelete={() => deleteRule(rule.id)} onTestSend={testSend} />
                ))}
              </div>
            )}
          </div>

          {pausedRules.length > 0 && (
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:C.t4, marginBottom:10, textTransform:'uppercase', letterSpacing:'.08em' }}>Paused</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {pausedRules.map(rule => (
                  <RuleCard key={rule.id} rule={rule} gymName={gymName}
                    onToggle={() => toggleRule(rule.id)} onEdit={u => editRule(rule.id, u)}
                    onDelete={() => deleteRule(rule.id)} onTestSend={testSend} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Card>
            <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:2 }}>Rule coverage</div>
              <div style={{ fontSize:11, color:C.t3 }}>Who these rules will reach</div>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Members enrolled',   value: totalMembers || 0 },
                { label:'Potentially at-risk', value: atRisk || 0 },
                { label:'Rules configured',   value: rules.length },
                { label:'Rules active',       value: enabledCount },
              ].map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:C.t2 }}>{s.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.t1, fontVariantNumeric:'tabular-nums' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:2 }}>Industry benchmarks</div>
              <div style={{ fontSize:11, color:C.t3 }}>CoStride gyms using automation</div>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { label:'Push notification open rate', value:'68%', bar:68 },
                { label:'Re-engagement of inactive',   value:'23%', bar:23 },
                { label:'2nd visit rate (new members)',value:'41%', bar:41 },
              ].map((s,i) => (
                <div key={i}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:11, color:C.t2, lineHeight:1.4 }}>{s.label}</span>
                    <span style={{ fontSize:13, fontWeight:800, color:C.t0, fontVariantNumeric:'tabular-nums' }}>{s.value}</span>
                  </div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ width:`${s.bar}%`, height:'100%', background:C.accent, borderRadius:99 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.t1, marginBottom:10 }}>How it works</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { n:'1', text:'A trigger fires (e.g. 14 days inactive)' },
                  { n:'2', text:'After your chosen delay, we send the member a push notification' },
                  { n:'3', text:'Re-engagements appear in your Members tab' },
                ].map(s => (
                  <div key={s.n} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                      background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, fontWeight:800, color:C.t3 }}>{s.n}</div>
                    <span style={{ fontSize:11, color:C.t3, lineHeight:1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
