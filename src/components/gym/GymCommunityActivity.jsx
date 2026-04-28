import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BarChart2 } from 'lucide-react';
import ActiveNowStrip from './ActiveNowStrip';
import GymActivityFeed from './GymActivityFeed';
import PollCard from '../polls/PollCard';
import SuggestedFriendsCard from './SuggestedFriendsCard';

export default function GymCommunityActivity({
  checkIns,
  memberAvatarMap,
  memberNameMap,
  workoutLogs,
  challengeParticipants,
  challenges,
  achievements,
  posts,
  hasMorePosts,
  onLoadMore,
  polls,
  currentUser,
  showOwnerControls,
  onVotePoll
}) {
  const livePolls = polls.filter(p => {
    if (!p.end_date) return true;
    return new Date(p.end_date).getTime() + 24 * 60 * 60 * 1000 - 1 >= Date.now();
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
      <ActiveNowStrip checkIns={checkIns} memberAvatarMap={memberAvatarMap} />
      <GymActivityFeed
        checkIns={checkIns}
        memberAvatarMap={memberAvatarMap}
        memberNameMap={memberNameMap}
        workoutLogs={workoutLogs}
        challengeParticipants={challengeParticipants}
        challenges={challenges}
        achievements={achievements}
        posts={posts}
      />
      {hasMorePosts &&
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <Button
          variant="outline"
          onClick={onLoadMore}
          style={{ borderRadius: 24, padding: '8px 28px', color: '#a0aec0', borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}>
          Load more posts
        </Button>
      </div>
      }
      <SuggestedFriendsCard checkIns={checkIns} currentUser={currentUser} memberAvatarMap={memberAvatarMap} />

      {livePolls.length > 0 &&
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BarChart2 style={{ width: 13, height: 13, color: '#60a5fa' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Live Polls</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{livePolls.length} active</span>
        </div>
        {livePolls.map(poll => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={!showOwnerControls && !poll.voters?.includes(currentUser?.id) ? (optionId) => onVotePoll({ pollId: poll.id, optionId }) : null}
            userVoted={poll.voters?.includes(currentUser?.id)}
            currentUser={currentUser}
          />
        ))}
      </div>
      }
    </motion.div>
  );
}