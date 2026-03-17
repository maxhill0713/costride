import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import {
  Dumbbell, Calendar, Users, Star, Trash2, Image as ImageIcon,
  MapPin, Tag, ShieldCheck, Clock, ChevronRight, ExternalLink,
  Settings, Camera, AlertTriangle, Copy, Check, Bell, Zap,
  TrendingUp, TrendingDown, Activity, Target, Award, Shield,
  Flame, Heart, BarChart2, Sparkles, CheckCircle, RefreshCw,
  UserPlus, MessageSquarePlus, Eye, Lock, Sliders, ToggleLeft,
  ToggleRight, Info
} from 'lucide-react';
import { Card, SectionTitle } from './DashboardPrimitives';

// ── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(value || ''); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <button onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, color: copied ? '#34d399' : 'var(--text3)', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', marginLeft: 6 }}>
      {copied ? <Check style={{ width: 9, height: 9 }}/> : <Copy style={{ width: 9, height: 9 }}/>}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────
function SectionHeading({ icon: Icon, color, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 14, height: 14, color }}/>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({ label, sub, value, onChange, color = '#0ea5e9' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', background: value ? `linear-gradient(90deg, ${color}, ${color}cc)` : 'rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}/>
      </button>
    </div>
  );
}

// ── Threshold slider row ───────────────────────────────────────────────────────
function ThresholdRow({ label, sub, value, min, max, step = 1, unit, onChange, color = '#ef4444' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{label}</span>
          {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, color, background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 7, padding: '2px 10px', letterSpacing: '-0.02em' }}>
          {value}{unit}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer', height: 4 }}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: '#475569' }}>{min}{unit}</span>
        <span style={{ fontSize: 9, color: '#475569' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Gym Health Overview (mini dashboard snapshot) ──────────────────────────────
function GymHealthOverview({ selectedGym, classes, coaches, checkIns, allMemberships, atRisk, retentionRate, now }) {
  const totalMembers = allMemberships?.length || 0;
  const ci30 = (checkIns || []).filter(c => {
    const d = new Date(c.check_in_date); const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
    return d >= cutoff;
  });

  const healthScore = useMemo(() => {
    let score = 0;
    if (selectedGym?.image_url)   score += 10;
    if (selectedGym?.logo_url)    score += 5;
    if (classes?.length > 0)      score += 15;
    if (coaches?.length > 0)      score += 15;
    if (totalMembers > 0)         score += 20;
    if (retentionRate >= 70)      score += 20;
    if (atRisk === 0)             score += 10;
    if (ci30.length > 0)          score += 5;
    return Math.min(100, score);
  }, [selectedGym, classes, coaches, totalMembers, retentionRate, atRisk, ci30]);

  const checks = [
    { label: 'Hero photo uploaded',     done: !!selectedGym?.image_url,        color: '#38bdf8' },
    { label: 'At least 1 class added',  done: (classes?.length || 0) > 0,       color: '#10b981' },
    { label: 'At least 1 coach added',  done: (coaches?.length || 0) > 0,       color: '#a78bfa' },
    { label: 'Members joined',          done: totalMembers > 0,                  color: '#f59e0b' },
    { label: 'Retention above 70%',     done: retentionRate >= 70,               color: '#34d399' },
    { label: 'No at-risk members',      done: atRisk === 0,                      color: '#ef4444' },
    { label: 'Check-ins this month',    done: ci30.length > 0,                   color: '#fb923c' },
    { label: 'Gym verified',            done: !!selectedGym?.verified,           color: '#38bdf8' },
  ];

  const done  = checks.filter(c => c.done).length;
  const total = checks.length;

  return (
    <div style={{ borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Accent line */}
      <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)' }}/>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Gym Health Score</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Your gym's overall setup & performance</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: healthScore >= 75 ? '#10b981' : healthScore >= 50 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.05em', lineHeight: 1 }}>{healthScore}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>/ 100</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ height: '100%', width: `${healthScore}%`, borderRadius: 99, background: healthScore >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : healthScore >= 50 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)', transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>

      {/* Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 8, background: c.done ? `${c.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${c.done ? c.color + '20' : 'rgba(255,255,255,0.05)'}` }}>
            {c.done
              ? <CheckCircle style={{ width: 12, height: 12, color: c.color, flexShrink: 0 }}/>
              : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}/>
            }
            <span style={{ fontSize: 11, fontWeight: 600, color: c.done ? 'var(--text1)' : 'var(--text3)' }}>{c.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{done} of {total} completed</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: healthScore >= 75 ? '#34d399' : '#fbbf24' }}>
          {healthScore >= 75 ? '✓ Fully set up' : `${total - done} action${total - done !== 1 ? 's' : ''} remaining`}
        </span>
      </div>
    </div>
  );
}

// ── Retention & Alert Thresholds ──────────────────────────────────────────────
function RetentionThresholds({ settings, onUpdate }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <SectionHeading icon={Sliders} color="#ef4444" title="Retention Thresholds" sub="Define when members are flagged as at-risk"/>

      <ThresholdRow
        label="At-risk threshold"
        sub="Flag members as at-risk after this many days of inactivity"
        value={settings.atRiskDays}
        min={7} max={30} unit=" days"
        color="#ef4444"
        onChange={v => onUpdate({ ...settings, atRiskDays: v })}
      />
      <ThresholdRow
        label="High-risk threshold"
        sub="Flag as high-risk (churn imminent) after this many days"
        value={settings.highRiskDays}
        min={14} max={60} unit=" days"
        color="#f87171"
        onChange={v => onUpdate({ ...settings, highRiskDays: v })}
      />
      <ThresholdRow
        label="New member window"
        sub="How long to track a member as 'new' after joining"
        value={settings.newMemberDays}
        min={7} max={60} unit=" days"
        color="#10b981"
        onChange={v => onUpdate({ ...settings, newMemberDays: v })}
      />
      <ThresholdRow
        label="Week-1 follow-up window"
        sub="Days after joining to check if a new member has returned"
        value={settings.week1FollowUpDays}
        min={5} max={14} unit=" days"
        color="#38bdf8"
        onChange={v => onUpdate({ ...settings, week1FollowUpDays: v })}
      />

      <div style={{ marginTop: 6, padding: '10px 12px', borderRadius: 9, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)' }}>
        <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700, marginBottom: 3 }}>Current configuration</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>
          Members flagged at-risk after <strong style={{ color: 'var(--text2)' }}>{settings.atRiskDays} days</strong> · High-risk after <strong style={{ color: 'var(--text2)' }}>{settings.highRiskDays} days</strong> · New window: <strong style={{ color: 'var(--text2)' }}>{settings.newMemberDays} days</strong>
        </div>
      </div>
    </Card>
  );
}

// ── Engagement Segment Rules ───────────────────────────────────────────────────
function SegmentationRules({ settings, onUpdate }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <SectionHeading icon={Users} color="#a78bfa" title="Member Segmentation Rules" sub="Define visit thresholds for each engagement tier"/>

      <ThresholdRow
        label="Super Active minimum"
        sub="Monthly visits to qualify as Super Active"
        value={settings.superActiveVisits}
        min={8} max={30} unit=" visits"
        color="#10b981"
        onChange={v => onUpdate({ ...settings, superActiveVisits: v })}
      />
      <ThresholdRow
        label="Active minimum"
        sub="Monthly visits to qualify as Active (below super active)"
        value={settings.activeVisits}
        min={2} max={15} unit=" visits"
        color="#0ea5e9"
        onChange={v => onUpdate({ ...settings, activeVisits: v })}
      />
      <ThresholdRow
        label="Casual minimum"
        sub="Monthly visits to qualify as Casual (above zero)"
        value={settings.casualVisits}
        min={1} max={5} unit=" visits"
        color="#a78bfa"
        onChange={v => onUpdate({ ...settings, casualVisits: v })}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 6 }}>
        {[
          { label: 'Super Active', range: `${settings.superActiveVisits}+/mo`, color: '#10b981' },
          { label: 'Active',       range: `${settings.activeVisits}–${settings.superActiveVisits - 1}/mo`, color: '#0ea5e9' },
          { label: 'Casual',       range: `${settings.casualVisits}–${settings.activeVisits - 1}/mo`, color: '#a78bfa' },
          { label: 'At Risk',      range: `${settings.atRiskDays}+ days away`, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: `${s.color}08`, border: `1px solid ${s.color}18`, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3 }}>{s.range}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Notification Preferences ──────────────────────────────────────────────────
function NotificationPreferences({ settings, onUpdate }) {
  const update = (key, val) => onUpdate({ ...settings, [key]: val });

  return (
    <Card style={{ padding: '20px 24px' }}>
      <SectionHeading icon={Bell} color="#f59e0b" title="Notification Preferences" sub="Control which alerts appear in your dashboard"/>

      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Member Alerts</div>
        <ToggleRow label="At-risk member alerts"    sub="Notify when members hit your at-risk threshold"              value={settings.alertAtRisk}        onChange={v => update('alertAtRisk', v)}        color="#ef4444"/>
        <ToggleRow label="New member follow-up"     sub="Remind to follow up with new members who haven't returned"  value={settings.alertNewMember}     onChange={v => update('alertNewMember', v)}     color="#10b981"/>
        <ToggleRow label="Streak recovery nudges"   sub="Alert when members break a consistent attendance streak"    value={settings.alertStreakBroken}  onChange={v => update('alertStreakBroken', v)}  color="#f59e0b"/>
        <ToggleRow label="Milestone celebrations"   sub="Show milestone badges when members hit visit milestones"    value={settings.alertMilestones}    onChange={v => update('alertMilestones', v)}    color="#a78bfa"/>
        <ToggleRow label="Quiet member spotlight"   sub="Surface members who attend but never engage socially"       value={settings.alertQuietMembers}  onChange={v => update('alertQuietMembers', v)}  color="#fb923c"/>
      </div>

      <div style={{ marginTop: 16, marginBottom: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Content & Community</div>
        <ToggleRow label="No post this week warning"    sub="Alert when you haven't posted for 3+ days"                value={settings.alertNoPost}         onChange={v => update('alertNoPost', v)}         color="#38bdf8"/>
        <ToggleRow label="Poll participation drops"     sub="Warn when poll engagement falls below 25%"                value={settings.alertPollLow}        onChange={v => update('alertPollLow', v)}        color="#a78bfa"/>
        <ToggleRow label="Challenge low uptake"         sub="Alert when a challenge has fewer than 25% of members"    value={settings.alertChallengeLow}   onChange={v => update('alertChallengeLow', v)}   color="#fbbf24"/>
        <ToggleRow label="No active challenge warning"  sub="Remind you when no challenge is currently running"       value={settings.alertNoChallenge}    onChange={v => update('alertNoChallenge', v)}    color="#f59e0b"/>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Class & Coach</div>
        <ToggleRow label="Low fill rate warnings"       sub="Alert when a class is below 30% capacity"                value={settings.alertLowFill}        onChange={v => update('alertLowFill', v)}        color="#fb923c"/>
        <ToggleRow label="Class dependency alerts"      sub="Flag when members are locked to a single class"          value={settings.alertClassDependency}onChange={v => update('alertClassDependency', v)} color="#fb923c"/>
        <ToggleRow label="Waitlist conversion alerts"   sub="Notify when waitlisted members aren't converting"        value={settings.alertWaitlist}       onChange={v => update('alertWaitlist', v)}       color="#38bdf8"/>
      </div>
    </Card>
  );
}

// ── Community Health Config ────────────────────────────────────────────────────
function CommunityHealthConfig({ settings, onUpdate }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <SectionHeading icon={Heart} color="#f87171" title="Community Health Config" sub="Tune how the community health score is calculated"/>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Check-in weight',   sub: 'How much regular attendance contributes',       key: 'weightCheckIn',   color: '#38bdf8' },
          { label: 'Challenge weight',  sub: 'How much challenge participation contributes',  key: 'weightChallenge', color: '#fbbf24' },
          { label: 'Post weight',       sub: 'How much community posting contributes',        key: 'weightPost',      color: '#a78bfa' },
          { label: 'Retention weight',  sub: 'How much member retention contributes',         key: 'weightRetention', color: '#10b981' },
        ].map(s => (
          <div key={s.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{s.label}</span>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{s.sub}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: s.color }}>{settings[s.key]}%</span>
            </div>
            <input type="range" min={0} max={50} step={5} value={settings[s.key]}
              onChange={e => onUpdate({ ...settings, [s.key]: Number(e.target.value) })}
              style={{ width: '100%', accentColor: s.color, cursor: 'pointer' }}/>
          </div>
        ))}
      </div>

      {/* Visual weight breakdown */}
      <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 8 }}>
        {[
          { key: 'weightCheckIn',   color: '#38bdf8' },
          { key: 'weightChallenge', color: '#fbbf24' },
          { key: 'weightPost',      color: '#a78bfa' },
          { key: 'weightRetention', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={{ flex: settings[s.key] || 1, height: '100%', background: s.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === 3 ? '0 99px 99px 0' : 0 }}/>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {[{ label: 'Check-ins', color: '#38bdf8' }, { label: 'Challenges', color: '#fbbf24' }, { label: 'Posts', color: '#a78bfa' }, { label: 'Retention', color: '#10b981' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: l.color }}/>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Smart Nudge Settings ──────────────────────────────────────────────────────
function SmartNudgeSettings({ settings, onUpdate }) {
  const update = (key, val) => onUpdate({ ...settings, [key]: val });
  return (
    <Card style={{ padding: '20px 24px' }}>
      <SectionHeading icon={Sparkles} color="#0ea5e9" title="Smart Nudges & Auto-Actions" sub="Control the AI-style suggestions and action panel behaviour"/>

      <ToggleRow label="Show 'What to do today' panel"    sub="Daily action recommendations on the Overview page"       value={settings.showTodayPanel}      onChange={v => update('showTodayPanel', v)}      color="#0ea5e9"/>
      <ToggleRow label="Smart content suggestions"        sub="Recommend when to post, run polls, and launch challenges" value={settings.showContentSuggestions} onChange={v => update('showContentSuggestions', v)} color="#a78bfa"/>
      <ToggleRow label="Streak recovery prompts"          sub="Surface members who just broke a streak for re-engagement" value={settings.showStreakRecovery}  onChange={v => update('showStreakRecovery', v)}  color="#f59e0b"/>
      <ToggleRow label="Drop-off risk map"                sub="Show the drop-off lifecycle stage breakdown"               value={settings.showDropOffMap}      onChange={v => update('showDropOffMap', v)}      color="#ef4444"/>
      <ToggleRow label="Referral tracking"                sub="Track which members are bringing in new sign-ups"          value={settings.showReferrals}       onChange={v => update('showReferrals', v)}       color="#a78bfa"/>
      <ToggleRow label="Class loyalty warnings"           sub="Flag members who only attend a single class/coach"         value={settings.showClassLoyalty}    onChange={v => update('showClassLoyalty', v)}    color="#fb923c"/>

      <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 9, background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Info style={{ width: 11, height: 11, color: '#38bdf8' }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8' }}>About smart nudges</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.5 }}>
          These widgets use your live gym data to surface the most impactful action for the moment. Disabling them hides the suggestion but does not affect underlying data.
        </div>
      </div>
    </Card>
  );
}

// ── Privacy & Visibility ───────────────────────────────────────────────────────
function PrivacySettings({ settings, onUpdate }) {
  const update = (key, val) => onUpdate({ ...settings, [key]: val });
  return (
    <Card style={{ padding: '20px 24px' }}>
      <SectionHeading icon={Lock} color="#64748b" title="Privacy & Visibility" sub="Control what's visible on your public gym page"/>

      <ToggleRow label="Show member count publicly"    sub="Display total member count on your public page"         value={settings.publicMemberCount}  onChange={v => update('publicMemberCount', v)}  color="#0ea5e9"/>
      <ToggleRow label="Show coach profiles"           sub="Display coach names and bios on public page"            value={settings.publicCoaches}      onChange={v => update('publicCoaches', v)}      color="#a78bfa"/>
      <ToggleRow label="Show class schedule"           sub="List your class timetable publicly"                     value={settings.publicClasses}      onChange={v => update('publicClasses', v)}      color="#10b981"/>
      <ToggleRow label="Show photo gallery"            sub="Display your gym photo gallery on the public page"      value={settings.publicGallery}      onChange={v => update('publicGallery', v)}      color="#38bdf8"/>
      <ToggleRow label="Allow member referral sharing" sub="Members can share a referral link to your gym"          value={settings.allowReferrals}     onChange={v => update('allowReferrals', v)}     color="#f59e0b"/>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabGym({
  selectedGym, classes, coaches, openModal,
  checkIns = [], allMemberships = [], atRisk = 0, retentionRate = 0,
}) {
  const now = new Date();
  const statusVerified = selectedGym?.verified;

  // ── Local settings state (in real app these persist to the gym record) ─────
  const [retentionSettings, setRetentionSettings] = useState({
    atRiskDays:        14,
    highRiskDays:      21,
    newMemberDays:     30,
    week1FollowUpDays: 7,
  });

  const [segmentSettings, setSegmentSettings] = useState({
    superActiveVisits: 12,
    activeVisits:      4,
    casualVisits:      1,
    atRiskDays:        retentionSettings.atRiskDays,
  });

  const [notifSettings, setNotifSettings] = useState({
    alertAtRisk:         true,
    alertNewMember:      true,
    alertStreakBroken:   true,
    alertMilestones:     true,
    alertQuietMembers:   true,
    alertNoPost:         true,
    alertPollLow:        false,
    alertChallengeLow:   true,
    alertNoChallenge:    true,
    alertLowFill:        true,
    alertClassDependency:false,
    alertWaitlist:       false,
  });

  const [communitySettings, setCommunitySettings] = useState({
    weightCheckIn:   40,
    weightChallenge: 20,
    weightPost:      20,
    weightRetention: 20,
  });

  const [nudgeSettings, setNudgeSettings] = useState({
    showTodayPanel:          true,
    showContentSuggestions:  true,
    showStreakRecovery:       true,
    showDropOffMap:           true,
    showReferrals:            true,
    showClassLoyalty:         true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    publicMemberCount: false,
    publicCoaches:     true,
    publicClasses:     true,
    publicGallery:     true,
    allowReferrals:    true,
  });

  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ height: 200, position: 'relative', background: 'linear-gradient(135deg, #0a1628 0%, #0d2248 50%, #0a1628 100%)', overflow: 'hidden' }}>
          {selectedGym?.image_url && <img src={selectedGym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}/>}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(17,24,39,0.65) 100%)' }}/>
          <button onClick={() => openModal('heroPhoto')} style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
            <Camera style={{ width: 12, height: 12 }}/> Edit Hero
          </button>
        </div>
        <div style={{ padding: '0 24px 24px', marginTop: -24, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(14,165,233,0.35)', border: '3px solid var(--card)', flexShrink: 0, cursor: 'pointer' }} onClick={() => openModal('logo')}>
                {selectedGym?.logo_url ? <img src={selectedGym.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 15 }}/> : <Dumbbell style={{ width: 26, height: 26, color: '#fff' }}/>}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.035em', lineHeight: 1 }}>{selectedGym?.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{selectedGym?.type}</span>
                  {selectedGym?.city && <>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)' }}/>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <MapPin style={{ width: 11, height: 11, color: 'var(--text3)' }}/>
                      <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{selectedGym?.city}</span>
                    </div>
                  </>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: statusVerified ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${statusVerified ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                    <ShieldCheck style={{ width: 10, height: 10, color: statusVerified ? '#34d399' : '#fbbf24' }}/>
                    <span style={{ fontSize: 10, fontWeight: 800, color: statusVerified ? '#34d399' : '#fbbf24', letterSpacing: '0.04em' }}>{statusVerified ? 'Verified' : 'Pending'}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => openModal('editInfo')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(14,165,233,0.12)', color: 'var(--cyan)', border: '1px solid rgba(14,165,233,0.25)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.12)'}>
              <Settings style={{ width: 13, height: 13 }}/> Edit Info
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 20 }}>
            {[
              { label: 'Monthly Price', value: selectedGym?.price ? `£${selectedGym.price}/mo` : 'Not set', icon: Tag,       color: selectedGym?.price ? 'var(--text1)' : '#f59e0b' },
              { label: 'Address',       value: selectedGym?.address,                                         icon: MapPin,    color: 'var(--text1)' },
              { label: 'Postcode',      value: selectedGym?.postcode,                                        icon: MapPin,    color: 'var(--text1)' },
              { label: 'Status',        value: statusVerified ? 'Verified' : 'Pending Approval',             icon: ShieldCheck, color: statusVerified ? '#10b981' : '#f59e0b' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <f.icon style={{ width: 10, height: 10, color: 'var(--text3)' }}/>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)' }}>{f.label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: f.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Gym Health Score ────────────────────────────────────────────────── */}
      <GymHealthOverview
        selectedGym={selectedGym} classes={classes} coaches={coaches}
        checkIns={checkIns} allMemberships={allMemberships}
        atRisk={atRisk} retentionRate={retentionRate} now={now}
      />

      {/* ── Manage sections ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { icon: Calendar, label: 'Classes',   count: classes.length,                     unit: 'total',  color: '#10b981', fn: () => openModal('classes')   },
          { icon: Users,    label: 'Coaches',   count: coaches.length,                      unit: 'total',  color: '#0ea5e9', fn: () => openModal('coaches')   },
          { icon: Dumbbell, label: 'Equipment', count: selectedGym?.equipment?.length || 0, unit: 'items',  color: '#a78bfa', fn: () => openModal('equipment') },
          { icon: Star,     label: 'Amenities', count: selectedGym?.amenities?.length || 0, unit: 'listed', color: '#f59e0b', fn: () => openModal('amenities') },
        ].map(({ icon: Icon, label, count, unit, color, fn }, i) => (
          <button key={i} onClick={fn} style={{ padding: '18px 20px', borderRadius: 16, cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `${color}08`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.transform = ''; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: 18, height: 18, color }}/>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}><span style={{ fontWeight: 800, color }}>{count}</span> {unit}</div>
              </div>
            </div>
            <ChevronRight style={{ width: 14, height: 14, color: 'var(--text3)' }}/>
          </button>
        ))}
      </div>

      {/* ── Settings grid ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <RetentionThresholds settings={retentionSettings} onUpdate={setRetentionSettings}/>
        <SegmentationRules settings={{ ...segmentSettings, atRiskDays: retentionSettings.atRiskDays }} onUpdate={setSegmentSettings}/>
      </div>

      <NotificationPreferences settings={notifSettings} onUpdate={setNotifSettings}/>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <CommunityHealthConfig settings={communitySettings} onUpdate={setCommunitySettings}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SmartNudgeSettings settings={nudgeSettings} onUpdate={setNudgeSettings}/>
          <PrivacySettings settings={privacySettings} onUpdate={setPrivacySettings}/>
        </div>
      </div>

      {/* ── Save bar ────────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', bottom: 16, zIndex: 20 }}>
        <div style={{ background: 'rgba(10,16,28,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Settings updated</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Changes apply to your dashboard immediately</div>
          </div>
          <button onClick={handleSave} style={{ padding: '9px 24px', borderRadius: 10, background: saved ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, rgba(14,165,233,0.9), rgba(6,182,212,0.85))', color: saved ? '#34d399' : '#fff', border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7 }}>
            {saved ? <><Check style={{ width: 14, height: 14 }}/> Saved</> : <><Settings style={{ width: 13, height: 13 }}/> Save Settings</>}
          </button>
        </div>
      </div>

      {/* ── Photos + Admin ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* Hero Photo */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Hero Photo</div>
            <button onClick={() => openModal('heroPhoto')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
          </div>
          {selectedGym?.image_url ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 140, cursor: 'pointer' }} onClick={() => openModal('heroPhoto')}>
              <img src={selectedGym.image_url} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            </div>
          ) : (
            <div onClick={() => openModal('heroPhoto')} style={{ height: 140, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.09)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 16, height: 16, color: 'rgba(14,165,233,0.5)' }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Add Hero Photo</span>
            </div>
          )}
        </Card>
        {/* Gallery */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Photo Gallery</div>
            <button onClick={() => openModal('photos')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan)', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>Manage</button>
          </div>
          {selectedGym?.gallery?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {selectedGym.gallery.slice(0, 6).map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
              ))}
            </div>
          ) : (
            <div onClick={() => openModal('photos')} style={{ height: 140, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.09)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon style={{ width: 16, height: 16, color: 'rgba(14,165,233,0.5)' }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Add Photos</span>
            </div>
          )}
        </Card>
        {/* Admin */}
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', marginBottom: 16 }}>Admin</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 4 }}>Owner Email</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', wordBreak: 'break-all' }}>{selectedGym?.owner_email || '—'}</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)' }}>Gym ID</div>
                <CopyButton value={selectedGym?.id}/>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedGym?.id || '—'}</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 10, background: statusVerified ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', border: `1px solid ${statusVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: statusVerified ? '#34d399' : '#fbbf24' }}>{statusVerified ? '✓ Verified' : 'Pending Approval'}</div>
            </div>
          </div>
          <Link to={createPageUrl('GymCommunity') + '?id=' + selectedGym?.id}>
            <button style={{ width: '100%', marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'var(--text2)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text2)'; }}>
              <ExternalLink style={{ width: 13, height: 13 }}/> View Public Gym Page
            </button>
          </Link>
        </Card>
      </div>

      {/* ── Danger Zone ─────────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#f87171' }}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>Danger Zone</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>These actions are permanent and cannot be undone.</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { title: 'Delete Gym',     desc: 'Permanently delete this gym and all its data, including members, check-ins, and content.', fn: () => openModal('deleteGym') },
            { title: 'Delete Account', desc: 'Permanently delete your owner account and all associated gyms. This cannot be reversed.',    fn: () => openModal('deleteAccount') },
          ].map((d, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>{d.desc}</div>
              </div>
              <button onClick={d.fn} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.22)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5'; }}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
