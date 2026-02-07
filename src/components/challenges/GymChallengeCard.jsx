import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trash2, Trophy, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function GymChallengeCard({ challenge, onJoin, isJoined = false, currentUser, onDelete = null, isOwner = false }) {
  const daysLeft = differenceInDays(new Date(challenge.end_date), new Date());
  const totalDays = differenceInDays(new Date(challenge.end_date), new Date(challenge.start_date));
  const daysElapsed = totalDays - daysLeft;
  const progressPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
  const participantCount = challenge.participants?.length || 0;
  const userHasJoined = currentUser ? (challenge.participants || []).includes(currentUser.id) : false;
  
  const handleJoinClick = () => {
    if (onJoin) {
      onJoin(challenge);
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white mb-0.5 truncate">{challenge.title}</h3>
            <p className="text-sm text-slate-300 truncate">{challenge.description}</p>
          </div>
        </div>
        {challenge.reward && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400">Reward</p>
            <p className="text-sm font-semibold text-amber-400">{challenge.reward}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-300">
          <Users className="w-4 h-4" />
          <span>{participantCount}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-300">
          <Clock className="w-4 h-4" />
          <span>{daysLeft}d left</span>
        </div>
        <div className="flex-1 text-sm text-slate-300">
          {challenge.goal_type === 'most_check_ins' && `${challenge.target_value} check-ins`}
          {challenge.goal_type === 'longest_streak' && `${challenge.target_value}-day streak`}
          {challenge.goal_type === 'total_weight' && `${challenge.target_value} lbs`}
          {challenge.goal_type === 'participation' && 'Most active wins'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex gap-2">
        <Button
          onClick={handleJoinClick}
          disabled={userHasJoined || isOwner}
          className={`flex-1 font-medium text-sm h-10 ${
            userHasJoined 
              ? 'bg-emerald-600 hover:bg-emerald-600 cursor-default' 
              : isOwner
              ? 'bg-slate-700 hover:bg-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700'
          }`}
        >
          {userHasJoined ? '✓ Joined' : isOwner ? 'Your Challenge' : 'Join Challenge'}
        </Button>
        {isOwner && onDelete && (
          <Button
            onClick={() => onDelete(challenge.id)}
            variant="outline"
            size="icon"
            className="border-red-500/50 hover:bg-red-500/10 h-10 w-10"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
    </Card>
  );
}