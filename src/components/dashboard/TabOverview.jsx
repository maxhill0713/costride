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
  Card, SectionTitle, Empty, Avatar, RingChart, Sparkline, ChartTip, TodaySnapshot
} from './DashboardPrimitives';
import { StreakCelebrations, GymSetupChecklist, SmartNudges } from './OverviewWidgets';

export default function TabOverview({
  // stats
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, peakLabel, peakEndLabel, peakEntry, satVsAvg, monthCiPer,
  // data
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  // computed
  streaks, recentActivity, chartDays, chartRange, setChartRange, avatarMap,
  priorities, selectedGym, now,
  // actions
  openModal, setTab,
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Today's Snapshot */}
        <TodaySnapshot
          checkIns={checkIns}
          posts={posts}
          polls={polls}
          challenges={challenges}
          classes={classes}
          allMemberships={allMemberships}
        />

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Today's Check-ins</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">{todayCI}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {yesterdayCI === 0
                    ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>{todayCI > 0 ? 'No data yesterday' : 'No check-ins yet'}</span>
                    : todayVsYest > 0
                      ? <><ArrowUpRight style={{ width: 13, height: 13, color: 'var(--green)' }}/><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>+{todayVsYest}% vs yesterday</span></>
                      : todayVsYest < 0
                        ? <><TrendingDown style={{ width: 13, height: 13, color: 'var(--red)' }}/><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{todayVsYest}% vs yesterday</span></>
                        : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Same as yesterday</span>
                  }
                </div>
              </div>
              <Sparkline data={sparkData} color="#10b981"/>
            </div>
            <div style={{ marginTop: 10, height: 2, borderRadius: 99, background: 'rgba(16,185,129,0.15)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (todayCI / Math.max(activeThisWeek / 7, 1)) * 100)}%`, background: 'linear-gradient(90deg,#10b981,#06b6d4)', borderRadius: 99 }}/>
            </div>
          </Card>

          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Active Members</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">
                  {activeThisWeek}<span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text3)' }}> / {totalMembers}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <ArrowUpRight style={{ width: 13, height: 13, color: 'var(--cyan)' }}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>{retentionRate}% engagement</span>
                </div>
              </div>
              <RingChart pct={retentionRate} size={56} stroke={5} color="#0ea5e9"/>
            </div>
          </Card>

          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Monthly Growth</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: newSignUps > 0 ? '#10b981' : 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">{newSignUps > 0 ? '+' : ''}{newSignUps}</span>
                  <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>this month</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  {ciPrev30.length === 0
                    ? <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>No prior month data</span>
                    : monthChangePct > 0
                      ? <><ArrowUpRight style={{ width: 13, height: 13, color: 'var(--green)' }}/><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>+{monthChangePct}% vs last month</span></>
                      : monthChangePct < 0
                        ? <><TrendingDown style={{ width: 13, height: 13, color: 'var(--red)' }}/><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>{monthChangePct}% vs last month</span></>
                        : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>Same as last month</span>
                  }
                </div>
              </div>
              <Sparkline data={monthGrowthData.map(d => d.value)} color="#10b981"/>
            </div>
          </Card>

          <Card style={{ padding: '20px 20px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>At-Risk Members</div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 800, color: atRisk > 0 ? '#ef4444' : 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }} className="anim-pop">{atRisk}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{atRisk > 0 ? '14+ days' : 'All members'} inactive</span>
              </div>
            </div>
            <Sparkline data={[...sparkData].map((v, i, a) => Math.max(0, a[a.length - 1 - i])).reverse()} color="#ef4444" height={32}/>
          </Card>
        </div>

        {/* Chart */}
        <Card style={{ padding: '20px 20px 14px' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>Member Growth</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#10b981', letterSpacing: '-0.04em' }}>+{newSignUps}</span>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>this month</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={monthGrowthData} barSize={20} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit' }} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length
                      ? <div className="custom-tooltip"><p style={{ color: 'var(--text2)', marginBottom: 2, fontSize: 10 }}>{label}</p><p style={{ color: 'var(--green)', fontWeight: 700 }}>{payload[0].value} active</p></div>
                      : null
                  }
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'New Members', value: newSignUps,     color: 'var(--text1)' },
                { label: 'Cancelled',   value: cancelledEst,   color: '#ef4444' },
                { label: 'Retention',   value: `${retentionRate}%`, color: '#10b981', arrow: true },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</span>
                    {s.arrow && <ArrowUpRight style={{ width: 12, height: 12, color: 'var(--green)' }}/>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Activity + Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <SectionTitle>Recent Activity</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivity.length === 0 && <Empty icon={Activity} label="No activity yet"/>}
              {recentActivity.slice(0, 5).map((a, i) => {
                const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
                const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={a.name} size={30} src={avatarMap[a.user_id] || null}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--text1)', lineHeight: 1.35 }}>
                        <span style={{ fontWeight: 700 }}>{a.name}</span>
                        <span style={{ color: 'var(--text3)' }}> {a.action}</span>
                        <span style={{ color: 'var(--text3)', fontSize: 10 }}> · {timeStr}</span>
                      </div>
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }}/>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 20 }}>
            <SectionTitle action={() => setTab('analytics')} actionLabel="View all">Insights</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {peakLabel && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Zap style={{ width: 13, height: 13, color: '#a78bfa' }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Peak: {peakLabel}–{peakEndLabel} today</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Expect {Math.round((peakEntry?.[1] || 0) * 1.1)}+ visits</span>
                </div>
              )}
              {satVsAvg !== 0 && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: satVsAvg >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.1)', border: `1px solid ${satVsAvg >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Star style={{ width: 13, height: 13, color: satVsAvg >= 0 ? '#34d399' : '#fbbf24' }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Sat attendance <span style={{ color: satVsAvg >= 0 ? '#34d399' : '#f87171' }}>{satVsAvg >= 0 ? '+' : ''}{satVsAvg}%</span></span>
                  </div>
                  {satVsAvg < 0 && <button onClick={() => openModal('challenge')} style={{ fontSize: 11, color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>→ Start challenge</button>}
                </div>
              )}
              {monthChangePct !== 0 && (
                <div style={{ padding: '11px 13px', borderRadius: 12, background: monthChangePct >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${monthChangePct >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp style={{ width: 13, height: 13, color: monthChangePct >= 0 ? '#34d399' : '#f87171' }}/>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>Monthly check-ins <span style={{ color: monthChangePct >= 0 ? '#34d399' : '#f87171' }}>{monthChangePct >= 0 ? '+' : ''}{monthChangePct}%</span></span>
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
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Today's Priorities</span>
            <MoreHorizontal style={{ width: 16, height: 16, color: 'var(--text3)', cursor: 'pointer' }}/>
          </div>
          {priorities.length === 0 ? (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 14, height: 14, color: '#10b981' }}/>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>All clear — great work!</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {priorities.map((p, i) => (
                <div key={i} className="priority-row" onClick={p.fn}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, flexShrink: 0 }}>
                    <p.icon style={{ width: 14, height: 14, color: p.color }}/>
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text1)', lineHeight: 1.3 }}>{p.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: 'nowrap' }}>→ {p.action}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: 18 }}>
          <SectionTitle>Quick Actions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: UserPlus,          label: 'Add Member',       color: '#0ea5e9', fn: () => openModal('members') },
              { icon: QrCode,            label: 'Scan Check-in',    color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: Trophy,            label: 'Create Challenge', color: '#f59e0b', fn: () => openModal('challenge') },
              { icon: MessageSquarePlus, label: 'Send Message',     color: '#a78bfa', fn: () => openModal('post') },
              { icon: Pencil,            label: 'Post Update',      color: '#38bdf8', fn: () => openModal('post') },
              { icon: Calendar,          label: 'Schedule Event',   color: '#34d399', fn: () => openModal('event') },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} className="qa-btn" onClick={fn}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>

        <SmartNudges
          atRisk={atRisk}
          challenges={challenges}
          polls={polls}
          monthChangePct={monthChangePct}
          openModal={openModal}
          setTab={setTab}
          checkIns={checkIns}
          allMemberships={allMemberships}
          now={now}
        />

        <GymSetupChecklist
          selectedGym={selectedGym}
          classes={classes}
          coaches={coaches}
          openModal={openModal}
        />

        <StreakCelebrations
          checkIns={checkIns}
          openModal={openModal}
          now={now}
        />

        <Card style={{ padding: 18 }}>
          <SectionTitle action={() => setTab('members')} actionLabel="All">Engagement</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Super Active', sub: '12+ visits',   val: monthCiPer.filter(v => v >= 12).length,           color: '#10b981', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 12).length / totalMembers) * 100 : 0 },
              { label: 'Active',       sub: '4–11 visits',  val: monthCiPer.filter(v => v >= 4 && v < 12).length,  color: '#0ea5e9', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 4 && v < 12).length / totalMembers) * 100 : 0 },
              { label: 'At Risk',      sub: '14+ days away', val: atRisk,                                           color: '#ef4444', pct: totalMembers > 0 ? (atRisk / totalMembers) * 100 : 0 },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{s.label} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>{s.sub}</span></span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99, opacity: 0.75, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
