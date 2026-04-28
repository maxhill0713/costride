import React from 'react';
import { motion } from 'framer-motion';
import BusyTimesChart from './BusyTimesChart';
import UpcomingEvents from '../home/UpcomingEvents';
import InlineLeaderboard from './InlineLeaderboard';
import { Star } from 'lucide-react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

export default function GymCommunityHome({
  checkIns,
  events,
  coaches,
  leaderboardView,
  setLeaderboardView,
  leaderboards,
  memberAvatarMap,
  showOwnerControls,
  onManageCoaches,
  onCoachSelect,
  gymId,
  gym,
  isMember
}) {
  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
      <BusyTimesChart checkIns={checkIns} gymId={gymId} />
      <UpcomingEvents gymMemberships={[{ gym_id: gymId, gym_name: gym?.name }]} currentUser={null} isMember={isMember} />
      <InlineLeaderboard
        view={leaderboardView}
        setView={setLeaderboardView}
        checkInLeaderboardWeek={(leaderboards.checkInLeaderboardWeek || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        checkInLeaderboardMonth={(leaderboards.checkInLeaderboardMonth || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        checkInLeaderboardAllTime={(leaderboards.checkInLeaderboardAllTime || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        streakLeaderboardWeek={(leaderboards.streakLeaderboardWeek || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        streakLeaderboardMonth={(leaderboards.streakLeaderboardMonth || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        streakLeaderboardAllTime={(leaderboards.streakLeaderboardAllTime || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        progressLeaderboardWeek={(leaderboards.progressLeaderboardWeek || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        progressLeaderboardMonth={(leaderboards.progressLeaderboardMonth || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
        progressLeaderboardAllTime={(leaderboards.progressLeaderboardAllTime || []).map(m => ({ ...m, userAvatar: memberAvatarMap[m.userId] || null }))}
      />

      {coaches.length > 0 &&
      <div style={{ background: CARD_BG, borderRadius: 18, overflow: 'hidden', border: CARD_BORDER, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Featured Coaches</span>
          {showOwnerControls &&
          <button onClick={onManageCoaches} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 7, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: '#60a5fa', cursor: 'pointer' }}>Edit</button>
          }
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {coaches.map((coach) => (
            <div key={coach.id} onClick={() => onCoachSelect(coach)} style={{ flexShrink: 0, width: 110, borderRadius: 16, background: CARD_BG, border: CARD_BORDER, backdropFilter: 'blur(20px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 10px 14px', gap: 6, position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.09) 50%,transparent 90%)' }} />
              <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0, border: '3px solid #fbbf24', boxShadow: '0 0 12px rgba(59,130,246,0.3), 0 0 0 2px rgba(251,191,36,0.6)' }}>
                {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(coach.name)}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{coach.name}</div>
              {coach.specialties?.length > 0 &&
              <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.55)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{coach.specialties.slice(0, 2).join(' · ')}</div>
              }
              {coach.rating &&
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star style={{ width: 10, height: 10, fill: '#fbbf24', color: '#fbbf24' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{coach.rating}</span>
              </div>
              }
            </div>
          ))}
        </div>
      </div>
      }
    </motion.div>
  );
}