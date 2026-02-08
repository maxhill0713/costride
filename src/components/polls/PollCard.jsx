import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

const categoryEmojis = {
  equipment_replacement: '🔧',
  favorite_equipment: '💪',
  rewards: '🎁',
  playlist: '🎵'
};

const categoryLabels = {
  equipment_replacement: 'Equipment Replacement',
  favorite_equipment: 'Favorite Equipment',
  rewards: 'Rewards',
  playlist: 'Playlist'
};

export default function PollCard({ poll, onVote, userVoted, isLoading }) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Card className="bg-slate-800/50 border border-slate-700/50 p-4 hover:border-blue-500/50 transition-all">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{categoryEmojis[poll.category]}</span>
              <h3 className="font-semibold text-white text-sm">{poll.title}</h3>
            </div>
            {poll.description && (
              <p className="text-xs text-slate-400 mb-2">{poll.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-300 border-slate-600 ml-2">
            {poll.status === 'active' ? 'Active' : 'Closed'}
          </Badge>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-2 mb-3">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes);
          const isSelected = userVoted && poll.voters?.includes(userVoted);

          return (
            <button
              key={option.id}
              onClick={() => !isSelected && onVote && onVote(option.id)}
              disabled={isSelected || poll.status === 'closed' || isLoading}
              className="w-full text-left group transition-all"
            >
              <div className="relative mb-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg"
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-slate-200 font-medium">{option.text}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300">{percentage}%</span>
                    {isSelected && poll.voters?.includes(userVoted) && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-400 px-3">
                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote Count */}
      <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-700">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </Card>
  );
}