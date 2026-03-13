import React, { useMemo } from 'react';
import { subDays, format, isWithinInterval } from 'date-fns';
import { Activity, TrendingUp, Users, Zap, ArrowUpRight, TrendingDown, Calendar, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const Card = ({ children, style = {} }) => (
  <div className="card-hover" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, ...style }}>{children}</div>
);

const Empty = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
    <Icon style={{ width: 28, height: 28, color: 'var(--text3)', opacity: 0.4 }}/>
    <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
  </div>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{color:'var(--text3)',marginBottom:2,fontSize:10}}>{label}</p>
      <p style={{color:'var(--cyan)',fontWeight:700,fontSize:13}}>{payload[0].value}</p>
    </div>
  );
};



export default function TabAnalytics({ checkIns, ci30, totalMembers, monthCiPer, monthChangePct, monthGrowthData, retentionRate, activeThisMonth, newSignUps, atRisk }) {
  const now = new Date();

  const weekTrend = Array.from({length:12},(_,i)=>{
    const s=subDays(now,(11-i)*7), e=subDays(now,(10-i)*7);
    return { label: format(s,'MMM d'), value: checkIns.filter(c=>isWithinInterval(new Date(c.check_in_date),{start:s,end:e})).length };
  });

  const hourAcc = {};
  checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h]||0)+1; });
  const hourMax = Math.max(...Object.values(hourAcc),1);
  const peakHours = Object.entries(hourAcc).sort(([,a],[,b])=>b-a).slice(0,8)
    .map(([hour,count]) => {
      const h = parseInt(hour);
      return { label: h===0?'12am':h<12?`${h}am`:h===12?'12pm':`${h-12}pm`, count, pct: (count/hourMax)*100 };
    });

  const dayAcc = {};
  checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); dayAcc[d] = (dayAcc[d]||0)+1; });
  const dayMax = Math.max(...Object.values(dayAcc),1);
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const busiestDays = dayNames.map((name,idx)=>({name, count:dayAcc[idx]||0})).sort((a,b)=>b.count-a.count);

  const dailyAvg   = Math.round(ci30.length/30);
  const avgPerMem  = totalMembers>0 ? (ci30.length/totalMembers).toFixed(1) : '—';
  const returnRate = checkIns.length>0 ? Math.round((checkIns.filter(c=>!c.first_visit).length/checkIns.length)*100) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { icon: Activity,   label: 'Daily Avg',      value: dailyAvg,                                       unit: 'check-ins',   color: '#0ea5e9', trend: monthChangePct },
            { icon: TrendingUp, label: 'Monthly Change',  value: `${monthChangePct>=0?'+':''}${monthChangePct}%`, unit: 'vs last month', color: monthChangePct>=0?'#10b981':'#ef4444', trend: monthChangePct },
            { icon: Users,      label: 'Avg / Member',   value: avgPerMem,                                      unit: 'visits / mo',  color: '#a78bfa', trend: null },
            { icon: Zap,        label: 'Return Rate',    value: `${returnRate}%`,                               unit: 'of check-ins', color: '#f59e0b', trend: null },
          ].map((k,i) => (
            <div key={i} style={{ borderRadius: 16, padding: '18px', background: 'var(--card)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: k.color, opacity: 0.07, filter: 'blur(12px)' }}/>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${k.color}18`, border: `1px solid ${k.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <k.icon style={{ width: 15, height: 15, color: k.color }}/>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text3)', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>{k.unit}</div>
              {k.trend !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8, padding: '3px 7px', borderRadius: 99, background: k.trend>=0?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', width: 'fit-content' }}>
                  {k.trend>=0 ? <ArrowUpRight style={{width:10,height:10,color:'#10b981'}}/> : <TrendingDown style={{width:10,height:10,color:'#ef4444'}}/>}
                  <span style={{ fontSize: 10, fontWeight: 700, color: k.trend>=0?'#34d399':'#f87171' }}>{Math.abs(k.trend)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <Card style={{ padding: '20px 20px 14px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Weekly Check-in Trend</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>12-week rolling view</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekTrend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs><linearGradient id="wtGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="label" tick={{fill:'#475569',fontSize:9,fontFamily:'Outfit'}} axisLine={false} tickLine={false} interval={2}/>
              <YAxis tick={{fill:'#475569',fontSize:9,fontFamily:'Outfit'}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip content={<ChartTip/>} cursor={{stroke:'rgba(59,130,246,0.2)',strokeWidth:1,strokeDasharray:'4 4'}}/>
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#wtGrad2)" dot={false} activeDot={{r:5,fill:'#3b82f6',stroke:'#fff',strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', marginBottom: 14 }}>Attendance Heatmap</div>
            {(() => {
              const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
              const slots = ['6AM','12PM','6PM','9PM'];
              const slotHours = [[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22]];
              const grid = {};
              checkIns.forEach(c => {
                const d = new Date(c.check_in_date);
                const dow = (d.getDay() + 6) % 7;
                const h = d.getHours();
                const slot = slotHours.findIndex(s => s.includes(h));
                if (slot === -1) return;
                const key = `${dow}-${slot}`;
                grid[key] = (grid[key] || 0) + 1;
              });
              const max = Math.max(...Object.values(grid), 1);
              const getColor = (v) => {
                if (!v) return 'rgba(255,255,255,0.04)';
                const t = v / max;
                if (t < 0.2) return 'rgba(6,182,212,0.15)';
                if (t < 0.4) return 'rgba(6,182,212,0.3)';
                if (t < 0.6) return 'rgba(6,182,212,0.5)';
                if (t < 0.8) return 'rgba(6,182,212,0.75)';
                return 'rgba(6,182,212,0.95)';
              };
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
                    <div/>{days.map(d => <div key={d} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' }}>{d}</div>)}
                  </div>
                  {slots.map((slot, si) => (
                    <div key={slot} style={{ display: 'grid', gridTemplateColumns: '36px repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>{slot}</div>
                      {days.map((_, di) => {
                        const v = grid[`${di}-${si}`] || 0;
                        return <div key={di} title={`${days[di]} ${slot}: ${v} check-ins`} style={{ height: 20, borderRadius: 4, background: getColor(v) }}/>;
                      })}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>Low</span>
                    {[0.04, 0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => (
                      <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: t < 0.1 ? 'rgba(255,255,255,0.04)' : `rgba(6,182,212,${t})` }}/>
                    ))}
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>High</span>
                  </div>
                </div>
              );
            })()}
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text1)', marginBottom: 14 }}>Peak Hours</div>
            {peakHours.length === 0 ? <Empty icon={Clock} label="No check-in data yet"/> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {peakHours.map((h, i) => (
                  <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: i===0?'#f59e0b':'var(--text3)', width: 20, textAlign: 'right', flexShrink: 0 }}>#{i+1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', width: 38, flexShrink: 0 }}>{h.label}</span>
                    <div style={{ flex: 1, height: 7, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${h.pct}%`, borderRadius: 99, background: i===0?'linear-gradient(90deg,#f59e0b,#ef4444)':'linear-gradient(90deg,#8b5cf6,#ec4899)', transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: i===0?'#fbbf24':'var(--text2)', width: 24, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12 }}>30-Day Snapshot</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Total check-ins', value: ci30.length,         color: '#0ea5e9' },
              { label: 'Active members',  value: activeThisMonth,     color: '#10b981' },
              { label: 'New sign-ups',    value: newSignUps,          color: '#a78bfa' },
              { label: 'At-risk members', value: atRisk,              color: atRisk>0?'#ef4444':'#10b981' },
              { label: 'Retention rate',  value: `${retentionRate}%`, color: retentionRate>=70?'#10b981':'#f59e0b' },
            ].map((s,i,arr) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i<arr.length-1?'1px solid rgba(255,255,255,0.05)':'none' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)' }}>{s.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12 }}>Busiest Days</div>
          {busiestDays.every(d=>d.count===0) ? <Empty icon={Calendar} label="No data yet"/> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {busiestDays.map(({name,count},rank) => {
                const pct = (count/dayMax)*100;
                const isTop = rank===0;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isTop?'#f59e0b':'var(--text3)', width: 20, textAlign: 'right', flexShrink: 0 }}>#{rank+1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text1)', width: 32, flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: isTop?'linear-gradient(90deg,#f59e0b,#ef4444)':'linear-gradient(90deg,#0ea5e9,#06b6d4)', transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}/>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: isTop?'#fbbf24':'var(--text2)', width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 12 }}>Engagement Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Super Active', sub: '15+', val: monthCiPer.filter(v=>v>=15).length, color: '#10b981', pct: totalMembers>0?(monthCiPer.filter(v=>v>=15).length/totalMembers)*100:0 },
              { label: 'Active',       sub: '8–14', val: monthCiPer.filter(v=>v>=8&&v<15).length, color: '#0ea5e9', pct: totalMembers>0?(monthCiPer.filter(v=>v>=8&&v<15).length/totalMembers)*100:0 },
              { label: 'Casual',       sub: '1–7',  val: monthCiPer.filter(v=>v>=1&&v<8).length,  color: '#a78bfa', pct: totalMembers>0?(monthCiPer.filter(v=>v>=1&&v<8).length/totalMembers)*100:0 },
              { label: 'Inactive',     sub: '0',    val: totalMembers - monthCiPer.length,         color: '#f59e0b', pct: totalMembers>0?((totalMembers-monthCiPer.length)/totalMembers)*100:0 },
            ].map((s,i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{s.label} <span style={{fontSize:10,color:'var(--text3)'}}>{s.sub}</span></span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.val}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99, opacity: 0.8, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Member Growth</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 12 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#10b981', letterSpacing: '-0.04em' }}>+{newSignUps}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>this month</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={monthGrowthData} barSize={14} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
              <defs><linearGradient id="mgBar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.35}/></linearGradient></defs>
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 9, fontFamily: 'Outfit' }} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="custom-tooltip"><p style={{color:'var(--text2)',marginBottom:2,fontSize:10}}>{label}</p><p style={{color:'#10b981',fontWeight:700}}>{payload[0].value} active</p></div> : null} cursor={{ fill: 'rgba(255,255,255,0.04)' }}/>
              <Bar dataKey="value" fill="url(#mgBar2)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}