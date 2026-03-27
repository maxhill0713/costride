import React, { useMemo } from 'react';
import { AlertTriangle, TrendingDown, Zap, Target, Users } from 'lucide-react';

const D = {
  bg: '#080e18', surface: '#0c1422', border: 'rgba(255,255,255,0.07)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569',
  red: '#ef4444', amber: '#f59e0b', green: '#10b981',
};

/**
 * Predictive Churn Scorer
 * Analyzes member patterns to flag at-risk members before they go inactive
 */
export function ChurnRiskScorer({ memberships, checkIns, now }) {
  const risks = useMemo(() => {
    return (memberships || []).map(m => {
      let score = 0;
      const last = checkIns.find(c => c.user_id === m.user_id);
      const daysAgo = last ? Math.floor((now - new Date(last.check_in_date)) / 86400000) : 999;
      const recent30 = checkIns.filter(c => c.user_id === m.user_id && 
        (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const recent90 = checkIns.filter(c => c.user_id === m.user_id && 
        (now - new Date(c.check_in_date)) < 90 * 86400000).length;

      if (daysAgo > 21) score += 40;
      else if (daysAgo > 14) score += 25;
      else if (daysAgo > 7) score += 10;

      if (recent30 < 2) score += 20;
      if (recent90 < 8) score += 15;

      const decline = recent30 < recent90 / 3 ? 20 : 0;
      score += decline;

      return {
        user_id: m.user_id,
        user_name: m.user_name,
        score: Math.min(100, score),
        daysAgo,
        recent30,
        reason: daysAgo > 14 ? 'Inactivity' : recent30 < 2 ? 'Low engagement' : 'Declining visits',
      };
    }).filter(r => r.score >= 40).sort((a, b) => b.score - a.score);
  }, [memberships, checkIns, now]);

  return (
    <div style={{ padding: '16px 18px', borderRadius: 14, background: D.surface, border: `1px solid ${D.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${D.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle style={{ width: 13, height: 13, color: D.red }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>Churn Risk Forecast</div>
          <div style={{ fontSize: 10, color: D.t3, marginTop: 1 }}>Members at-risk of leaving</div>
        </div>
      </div>

      {risks.length === 0 ? (
        <div style={{ padding: '12px', borderRadius: 9, background: `${D.green}0d`, border: `1px solid ${D.green}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: D.green, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: D.green }}>All members engagement healthy</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {risks.slice(0, 4).map((r, i) => (
            <div key={r.user_id} style={{
              padding: '9px 11px', borderRadius: 8, background: D.bg,
              border: `1px solid ${D.border}`,
              borderLeft: `3px solid ${r.score > 75 ? D.red : D.amber}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: D.t1 }}>{r.user_name}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: r.score > 75 ? D.red : D.amber, background: r.score > 75 ? `${D.red}15` : `${D.amber}15`, borderRadius: 5, padding: '1px 7px' }}>
                  {r.score}%
                </span>
              </div>
              <div style={{ fontSize: 10, color: D.t3 }}>{r.reason} • {r.daysAgo}d ago</div>
            </div>
          ))}
          {risks.length > 4 && <span style={{ fontSize: 9, color: D.t3, marginTop: 3 }}>+{risks.length - 4} more at-risk</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Client Segmentation
 * Groups members by engagement behavior for targeted coaching strategies
 */
export function ClientSegments({ memberships, checkIns, now }) {
  const segments = useMemo(() => {
    const seg = { superActive: [], active: [], casual: [], declining: [], dormant: [] };

    (memberships || []).forEach(m => {
      const recent30 = checkIns.filter(c => c.user_id === m.user_id && 
        (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const recent90 = checkIns.filter(c => c.user_id === m.user_id && 
        (now - new Date(c.check_in_date)) < 90 * 86400000).length;

      if (recent30 >= 12) seg.superActive.push(m);
      else if (recent30 >= 4) seg.active.push(m);
      else if (recent30 >= 1) seg.casual.push(m);
      else if (recent90 >= 3) seg.declining.push(m);
      else seg.dormant.push(m);
    });

    return seg;
  }, [memberships, checkIns, now]);

  const total = memberships?.length || 1;
  const segs = [
    { key: 'superActive', label: 'Super Active', color: D.green, count: segments.superActive.length, icon: '🔥' },
    { key: 'active', label: 'Active', color: '#38bdf8', count: segments.active.length, icon: '⚡' },
    { key: 'casual', label: 'Casual', color: '#a78bfa', count: segments.casual.length, icon: '📅' },
    { key: 'declining', label: 'Declining', color: D.amber, count: segments.declining.length, icon: '📉' },
    { key: 'dormant', label: 'Dormant', color: D.red, count: segments.dormant.length, icon: '😴' },
  ];

  return (
    <div style={{ padding: '16px 18px', borderRadius: 14, background: D.surface, border: `1px solid ${D.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `#a78bfa12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users style={{ width: 13, height: 13, color: '#a78bfa' }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>Client Segments</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {segs.map(s => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <div key={s.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: D.t2 }}>{s.icon} {s.label}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{s.count}</span>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 99, transition: 'width 0.7s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${D.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Recommendations</div>
        <div style={{ fontSize: 10, color: D.t3, lineHeight: 1.6 }}>
          • Focus on <span style={{ color: D.amber }}>declining members</span> with personal outreach<br/>
          • Promote <span style={{ color: D.green }}>super active</span> members as ambassadors<br/>
          • Create <span style={{ color: '#a78bfa' }}>casual</span> member engagement challenges
        </div>
      </div>
    </div>
  );
}

/**
 * Performance Scorecard
 * Quantifies coaching impact metrics
 */
export function PerformanceScorecard({ myClasses, memberships, checkIns, now }) {
  const metrics = useMemo(() => {
    const activeCount = memberships.filter(m => 
      checkIns.some(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000)
    ).length;

    const avgSessions = memberships.length > 0 
      ? (checkIns.filter(c => (now - new Date(c.check_in_date)) < 30 * 86400000).length / memberships.length).toFixed(1)
      : 0;

    const retentionRate = memberships.length > 0
      ? Math.round((checkIns.filter(c => (now - new Date(c.check_in_date)) < 30 * 86400000).length / memberships.length) / 4 * 100)
      : 0;

    const engagementScore = Math.round((activeCount / Math.max(memberships.length, 1)) * 100);

    return { activeCount, avgSessions, retentionRate, engagementScore };
  }, [memberships, checkIns, now]);

  return (
    <div style={{ padding: '16px 18px', borderRadius: 14, background: D.surface, border: `1px solid ${D.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `#fbbf2412`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target style={{ width: 13, height: 13, color: '#fbbf24' }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>Coaching Impact Score</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {[
          { label: 'Active Members', value: metrics.activeCount, unit: `/${memberships.length}`, color: D.green },
          { label: 'Avg Sessions/mo', value: metrics.avgSessions, unit: '', color: '#38bdf8' },
          { label: 'Engagement', value: metrics.engagementScore, unit: '%', color: D.amber },
          { label: 'Retention', value: metrics.retentionRate, unit: '%', color: '#a78bfa' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '10px', borderRadius: 9, background: D.bg, border: `1px solid ${D.border}` }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: m.color, letterSpacing: '-0.03em' }}>{m.value}{m.unit}</div>
            <div style={{ fontSize: 9, color: D.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}