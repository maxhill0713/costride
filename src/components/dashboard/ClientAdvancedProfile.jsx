import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle, Zap, Calendar, Target, Heart } from 'lucide-react';

const D = {
  bg: '#080e18', surface: '#0c1422', border: 'rgba(255,255,255,0.07)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569',
  red: '#ef4444', amber: '#f59e0b', green: '#10b981',
};

/**
 * Advanced Client Profile Card
 * Displays client health, recommendations, and coaching insights
 */
export function ClientAdvancedProfile({ client, checkIns, now }) {
  const analysis = useMemo(() => {
    const last = checkIns.find(c => c.user_id === client.user_id);
    const daysAgo = last ? Math.floor((now - new Date(last.check_in_date)) / 86400000) : 999;
    
    const recent7 = checkIns.filter(c => c.user_id === client.user_id && 
      (now - new Date(c.check_in_date)) < 7 * 86400000).length;
    const recent30 = checkIns.filter(c => c.user_id === client.user_id && 
      (now - new Date(c.check_in_date)) < 30 * 86400000).length;
    const recent90 = checkIns.filter(c => c.user_id === client.user_id && 
      (now - new Date(c.check_in_date)) < 90 * 86400000).length;

    const trend = recent30 > recent90 / 3 ? 'increasing' : recent30 < recent90 / 4 ? 'declining' : 'stable';
    const momentum = recent7 >= 2 ? 'strong' : recent7 === 1 ? 'building' : 'stalled';

    const recommendations = [];
    if (daysAgo > 14) recommendations.push({ icon: '⚠️', text: 'Schedule personal check-in ASAP' });
    if (recent30 < 2 && recent90 > 0) recommendations.push({ icon: '💬', text: 'Send motivation message' });
    if (momentum === 'stalled') recommendations.push({ icon: '🎯', text: 'Adjust training plan' });
    if (trend === 'increasing' && recent30 >= 8) recommendations.push({ icon: '🌟', text: 'Consider them for ambassador role' });

    return { daysAgo, recent7, recent30, recent90, trend, momentum, recommendations };
  }, [client, checkIns, now]);

  const color = analysis.daysAgo > 14 ? D.red : analysis.daysAgo > 7 ? D.amber : D.green;
  const status = analysis.daysAgo > 14 ? 'At Risk' : analysis.daysAgo > 7 ? 'Needs Attention' : 'Active';

  return (
    <div style={{ padding: '16px 18px', borderRadius: 14, background: D.surface, border: `1px solid ${D.border}`, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>{client.user_name}</div>
          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 5, padding: '1px 7px', display: 'inline-block', marginTop: 4 }}>
            {status}
          </span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: D.t2 }}>
          <div>{analysis.recent30}</div>
          <div style={{ fontSize: 9, color: D.t3, fontWeight: 400, marginTop: 2 }}>visits/mo</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'This Week', value: analysis.recent7, color: analysis.recent7 >= 2 ? D.green : D.t3 },
          { label: 'This Month', value: analysis.recent30, color: analysis.recent30 >= 4 ? D.green : D.t3 },
          { label: 'Last Seen', value: `${analysis.daysAgo}d ago`, color: D.t3 },
        ].map((s, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: D.bg, border: `1px solid ${D.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 8, color: D.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trend badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 8, background: D.bg, border: `1px solid ${D.border}`, marginBottom: 12 }}>
        <TrendingUp style={{ width: 12, height: 12, color: analysis.trend === 'increasing' ? D.green : analysis.trend === 'declining' ? D.red : D.amber }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: D.t2 }}>
          Trend: <span style={{ color: analysis.trend === 'increasing' ? D.green : analysis.trend === 'declining' ? D.red : D.amber, fontWeight: 700 }}>
            {analysis.trend.charAt(0).toUpperCase() + analysis.trend.slice(1)}
          </span>
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, color: D.t3, marginLeft: 'auto' }}>
          Momentum: {analysis.momentum}
        </span>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div style={{ padding: '10px 0', borderTop: `1px solid ${D.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Coaching Tips</div>
          {analysis.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < analysis.recommendations.length - 1 ? 5 : 0 }}>
              <span style={{ fontSize: 10 }}>{rec.icon}</span>
              <span style={{ fontSize: 10, color: D.t2 }}>{rec.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Class Performance Deep Dive
 * Analyzes individual class metrics and attendance patterns
 */
export function ClassPerformanceWidget({ cls, checkIns, now }) {
  const analysis = useMemo(() => {
    const recent30 = checkIns.filter(c => (now - new Date(c.check_in_date)) < 30 * 86400000).length;
    const avgAttendance = Math.round(recent30 / 4);
    const capacity = cls.max_capacity || 15;
    const fillRate = Math.min(100, Math.round((avgAttendance / capacity) * 100));
    
    const sessionDates = checkIns
      .map(c => new Date(c.check_in_date).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i);
    const totalSessions = sessionDates.length;
    
    const trend = recent30 > 5 ? 'growing' : recent30 < 2 ? 'declining' : 'stable';

    return { avgAttendance, fillRate, totalSessions, recent30, trend };
  }, [cls, checkIns, now]);

  const trendColor = analysis.trend === 'growing' ? D.green : analysis.trend === 'declining' ? D.red : D.amber;

  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: D.bg, border: `1px solid ${D.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: D.t1 }}>{cls.name}</div>
          <div style={{ fontSize: 10, color: D.t3, marginTop: 2 }}>Avg {analysis.avgAttendance} / {cls.max_capacity || 15} capacity</div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 900, color: analysis.fillRate >= 70 ? D.green : analysis.fillRate >= 50 ? D.amber : D.red, letterSpacing: '-0.02em' }}>
          {analysis.fillRate}%
        </span>
      </div>

      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${analysis.fillRate}%`, background: trendColor, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9, color: D.t3 }}>
        <span>{analysis.totalSessions} sessions · {analysis.recent30} last 30d</span>
        <span style={{ color: trendColor, fontWeight: 700 }}>{analysis.trend}</span>
      </div>
    </div>
  );
}