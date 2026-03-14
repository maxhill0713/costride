import React from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Zap, Star,
  CheckCircle, Trophy, BarChart2, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Sparkles, MoreHorizontal
} from 'lucide-react';
import {
  Card, SectionTitle, Empty, Avatar, RingChart, Sparkline, ChartTip
} from './DashboardPrimitives';
import { StreakCelebrations, GymSetupChecklist, SmartNudges } from './OverviewWidgets';

// ── Elevated KPI Card ─────────────────────────────────────────────────────────
function KpiCard({ label, value, valueSuffix, sub, subColor, subIcon: SubIcon, sparkData, sparkColor, ring, ringColor, accentColor, footerBar, gradient, icon: Icon }) {
  return (
    <div style={{
      borderRadius: 16,
      padding: '18px 20px 16px',
      background: gradient || 'var(--card)',
      border: `1px solid rgba(255,255,255,0.07)`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', bottom: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: accentColor || '#0ea5e9',
        opacity: 0.07, filter: 'blur(28px)', pointerEvents: 'none',
      }}/>

      {/* Top row: label + icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text3)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>{label}</span>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `${accentColor || '#0ea5e9'}18`,
            border: `1px solid ${accentColor || '#0ea5e9'}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 13, height: 13, color: accentColor || '#0ea5e9' }}/>
          </div>
        )}
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, color: 'var(--text1)',
              lineHeight: 1, letterSpacing: '-0.04em',
            }}>{value}</span>
            {valueSuffix && (
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text3)', letterSpacing: '-0.02em' }}>{valueSuffix}</span>
            )}
          </div>
          {/* Sub-label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7 }}>
            {SubIcon && <SubIcon style={{ width: 11, height: 11, color: subColor || 'var(--text3)' }}/>}
            <span style={{ fontSize: 11, fontWeight: 600, color: subColor || 'var(--text3)', lineHeight: 1.3 }}>{sub}</span>
          </div>
        </div>
        {ring != null ? (
          <RingChart pct={ring} size={52} stroke={5} color={ringColor || '#0ea5e9'}/>
        ) : sparkData ? (
          <Sparkline data={sparkData} color={accentColor || '#0ea5e9'}/>
        ) : null}
      </div>

      {/* Footer bar */}
      {footerBar != null && (
        <div style={{ marginTop: 6, height: 3, borderRadius: 99, background: `${accentColor || '#0ea5e9'}18`, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${Math.min(100, footerBar)}%`,
            background: `linear-gradient(90deg, ${accentColor || '#10b981'}, ${accentColor ? accentColor + 'cc' : '#06b6d4'})`,
            transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}/>
        </div>
      )}

      {/* Subtle top border accent */}
      <div style={{
        position: 'absolute', top: 0, left: 16, right: 16,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor || '#0ea5e9'}50, transparent)`,
        pointerEvents: 'none',
      }}/>
    </div>
  );
}

export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, peakLabel, peakEndLabel, peakEntry, satVsAvg, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  streaks, recentActivity, chartDays, chartRange, setChartRange, avatarMap,
  priorities, selectedGym, now,
  openModal, setTab,
}) {

  // Build sub-label for today's check-ins
  const ciSub = yesterdayCI === 0
    ? (todayCI > 0 ? 'No data yesterday' : 'No check-ins yet')
    : todayVsYest > 0
      ? `+${todayVsYest}% vs yesterday`
      : todayVsYest < 0
        ? `${todayVsYest}% vs yesterday`
        : 'Same as yesterday';

  const ciSubColor = yesterdayCI > 0 && todayVsYest > 0 ? '#34d399'
    : yesterdayCI > 0 && todayVsYest < 0 ? '#f87171'
    : 'var(--text3)';

  const ciSubIcon = yesterdayCI > 0 && todayVsYest > 0 ? ArrowUpRight
    : yesterdayCI > 0 && todayVsYest < 0 ? TrendingDown
    : null;

  const growthSub = ciPrev30.length === 0
    ? 'No prior month data'
    : monthChangePct > 0
      ? `+${monthChangePct}% vs last month`
      : monthChangePct < 0
        ? `${monthChangePct}% vs last month`
        : 'Same as last month';

  const growthSubColor = monthChangePct > 0 ? '#34d399' : monthChangePct < 0 ? '#f87171' : 'var(--text3)';
  const growthSubIcon  = monthChangePct > 0 ? ArrowUpRight : monthChangePct < 0 ? TrendingDown : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <KpiCard
            label="Today's Check-ins"
            value={todayCI}
            sub={ciSub}
            subColor={ciSubColor}
            subIcon={ciSubIcon}
            sparkData={sparkData}
            accentColor="#10b981"
            footerBar={Math.min(100, (todayCI / Math.max(activeThisWeek / 7, 1)) * 100)}
            icon={Activity}
          />
          <KpiCard
            label="Active Members"
            value={activeThisWeek}
            valueSuffix={`/ ${totalMembers}`}
            sub={`${retentionRate}% engagement`}
            subColor="#38bdf8"
            subIcon={ArrowUpRight}
            ring={retentionRate}
            ringColor="#0ea5e9"
            accentColor="#0ea5e9"
            icon={UserPlus}
          />
          <KpiCard
            label="Monthly Growth"
            value={`${newSignUps > 0 ? '+' : ''}${newSignUps}`}
            sub={growthSub}
            subColor={growthSubColor}
            subIcon={growthSubIcon}
            sparkData={monthGrowthData.map(d => d.value)}
            accentColor="#10b981"
            icon={TrendingUp}
          />
          <KpiCard
            label="At-Risk Members"
            value={atRisk}
            sub={atRisk > 0 ? '14+ days inactive' : 'All members active'}
            subColor={atRisk > 0 ? '#f87171' : '#34d399'}
            subIcon={atRisk > 0 ? TrendingDown : CheckCircle}
            sparkData={[...sparkData].map((v, i, a) => Math.max(0, a[a.length - 1 - i])).reverse()}
            accentColor={atRisk > 0 ? '#ef4444' : '#10b981'}
            icon={Zap}
          />
        </div>

        {/* Chart */}
        <Card style={{ padding: '20px 20px 14px', position: 'relative', overflow: 'hidden' }}>
          {/* subtle top-border accent */}
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Check-ins Over Time</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Daily attendance trend</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30, 90].map(r => (
                <button key={r} onClick={() => setChartRange(r)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s',
                    background: chartRange === r ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: chartRange === r ? 'var(--cyan)' : 'var(--text3)',
                    border: `1px solid ${chartRange === r ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  {r === 7 ? '7D' : r === 30 ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={chartDays} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#0ea5e9" stopOpacity={0.4}/>
                  <stop offset="60%"  stopColor="#0ea5e9" stopOpacity={0.12}/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : chartRange <= 30 ? 5 : 14}/>
              <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false} width={26}/>
              <Tooltip content={<ChartTip/>} cursor={{ stroke: 'rgba(0,212,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
              <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#ciGrad)" dot={false} activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Member Growth */}
        <Card style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>Member Growth</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#10b981', letterSpacing: '-0.04em' }}>+{newSignUps}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>this month</span>
              </div>
            </div>
            {/* Mini stat chips */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 10, fontWeight: 700, color: '#34d399' }}>
                {retentionRate}% retention
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 10, fontWeight: 700, color: '#f87171' }}>
                {cancelledEst} cancelled
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={monthGrowthData} barSize={20} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={({ active, payload, label }) => active && payload?.length
                ? <div className="custom-tooltip"><p style={{ color: 'var(--text2)', marginBottom: 2, fontSize: 10 }}>{label}</p><p style={{ color: 'var(--green)', fontWeight: 700 }}>{payload[0].value} active</p></div>
                : null} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
              <Bar dataKey="value" fill="url(#barGrad)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>

          {/* Footer stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'New Members', value: newSignUps, color: '#10b981', icon: ArrowUpRight },
              { label: 'Cancelled',   value: cancelledEst, color: '#ef4444', icon: TrendingDown },
              { label: 'Retention',   value: `${retentionRate}%`, color: '#38bdf8', icon: ArrowUpRight },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</span>
                  <s.icon style={{ width: 11, height: 11, color: s.color }}/>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity + Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)', pointerEvents: 'none' }}/>
            <SectionTitle>Recent Activity</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentActivity.length === 0 && <Empty icon={Activity} label="No activity yet"/>}
              {recentActivity.slice(0, 5).map((a, i) => {
                const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
                const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={a.name} size={30} src={avatarMap[a.user_id] || null}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text1)', lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 700 }}>{a.name}</span>
                        <span style={{ color: 'var(--text3)' }}> {a.action}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{timeStr}</div>
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: `0 0 6px ${a.color}80` }}/>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)', pointerEvents: 'none' }}/>
            <SectionTitle action={() => setTab('analytics')} actionLabel="View all">Insights</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {peakLabel && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)' }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Zap style={{ width: 12, height: 12, color: '#a78bfa' }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Peak: {peakLabel}–{peakEndLabel} today</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Expect {Math.round((peakEntry?.[1] || 0) * 1.1)}+ visits</span>
                </div>
              )}
              {satVsAvg !== 0 && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: satVsAvg >= 0 ? 'rgba(16,185,129,0.07)' : 'rgba(245,158,11,0.08)', border: `1px solid ${satVsAvg >= 0 ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${satVsAvg >= 0 ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.4)'},transparent)` }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: satVsAvg < 0 ? 6 : 0 }}>
                    <Star style={{ width: 12, height: 12, color: satVsAvg >= 0 ? '#34d399' : '#fbbf24' }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>
                      Sat attendance <span style={{ color: satVsAvg >= 0 ? '#34d399' : '#f87171' }}>{satVsAvg >= 0 ? '+' : ''}{satVsAvg}%</span>
                    </span>
                  </div>
                  {satVsAvg < 0 && (
                    <button onClick={() => openModal('challenge')} style={{ fontSize: 11, color: '#fbbf24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontWeight: 700 }}>
                      Start a challenge →
                    </button>
                  )}
                </div>
              )}
              {monthChangePct !== 0 && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: monthChangePct >= 0 ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)', border: `1px solid ${monthChangePct >= 0 ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${monthChangePct >= 0 ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'},transparent)` }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp style={{ width: 12, height: 12, color: monthChangePct >= 0 ? '#34d399' : '#f87171' }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>
                      Monthly check-ins <span style={{ color: monthChangePct >= 0 ? '#34d399' : '#f87171' }}>{monthChangePct >= 0 ? '+' : ''}{monthChangePct}%</span>
                    </span>
                  </div>
                </div>
              )}
              {peakLabel === null && satVsAvg === 0 && monthChangePct === 0 && (
                <Empty icon={Sparkles} label="Check back once members are active"/>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Priorities */}
        <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Today's Priorities</span>
            <MoreHorizontal style={{ width: 15, height: 15, color: 'var(--text3)', cursor: 'pointer' }}/>
          </div>
          {priorities.length === 0 ? (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 13, height: 13, color: '#10b981' }}/>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>All clear — great work!</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {priorities.map((p, i) => (
                <div key={i} className="priority-row" onClick={p.fn}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, flexShrink: 0 }}>
                    <p.icon style={{ width: 13, height: 13, color: p.color }}/>
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text1)', lineHeight: 1.35 }}>{p.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.color, whiteSpace: 'nowrap', padding: '3px 8px', borderRadius: 6, background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                    {p.action} →
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.35), transparent)', pointerEvents: 'none' }}/>
          <SectionTitle>Quick Actions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {[
              { icon: UserPlus,          label: 'Add Member',       color: '#0ea5e9', fn: () => openModal('members') },
              { icon: QrCode,            label: 'Scan Check-in',    color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: Trophy,            label: 'New Challenge',    color: '#f59e0b', fn: () => openModal('challenge') },
              { icon: MessageSquarePlus, label: 'Send Message',     color: '#a78bfa', fn: () => openModal('post') },
              { icon: Pencil,            label: 'Post Update',      color: '#38bdf8', fn: () => openModal('post') },
              { icon: Calendar,          label: 'Schedule Event',   color: '#34d399', fn: () => openModal('event') },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} className="qa-btn" onClick={fn} style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 13, height: 13, color }}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text1)' }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>

        <SmartNudges atRisk={atRisk} challenges={challenges} polls={polls} monthChangePct={monthChangePct} openModal={openModal} setTab={setTab} checkIns={checkIns} allMemberships={allMemberships} now={now}/>
        <GymSetupChecklist selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal}/>
        <StreakCelebrations checkIns={checkIns} openModal={openModal} now={now}/>

        {/* Engagement breakdown */}
        <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.35), transparent)', pointerEvents: 'none' }}/>
          <SectionTitle action={() => setTab('members')} actionLabel="All">Engagement</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Super Active', sub: '12+ visits',   val: monthCiPer.filter(v => v >= 12).length,          color: '#10b981', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 12).length / totalMembers) * 100 : 0 },
              { label: 'Active',       sub: '4–11 visits',  val: monthCiPer.filter(v => v >= 4 && v < 12).length, color: '#0ea5e9', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 4 && v < 12).length / totalMembers) * 100 : 0 },
              { label: 'At Risk',      sub: '14+ days away', val: atRisk,                                           color: '#ef4444', pct: totalMembers > 0 ? (atRisk / totalMembers) * 100 : 0 },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{s.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, marginLeft: 5 }}>{s.sub}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text3)' }}>{Math.round(s.pct)}%</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
