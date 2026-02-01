import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award } from 'lucide-react';

const stages = [
  {
    name: 'Starter',
    min: 0,
    max: 9,
    color: 'from-slate-400 to-slate-500',
    message: 'Every journey starts with showing up'
  },
  {
    name: 'Getting Consistent',
    min: 10,
    max: 19,
    color: 'from-blue-400 to-cyan-500',
    message: 'Building your gym habit, one visit at a time'
  },
  {
    name: 'Committed',
    min: 20,
    max: 29,
    color: 'from-purple-400 to-pink-500',
    message: 'Consistency is your superpower'
  },
  {
    name: 'Gym Regular',
    min: 30,
    max: 30,
    color: 'from-yellow-400 to-orange-500',
    message: 'You\'ve made showing up a lifestyle!'
  }
];

export default function ConsistencyJourney({ totalCheckIns }) {
  const getCurrentStage = () => {
    return stages.find(stage => totalCheckIns >= stage.min && totalCheckIns <= stage.max) || stages[0];
  };

  const getProgressToNextStage = () => {
    const currentStage = getCurrentStage();
    
    if (totalCheckIns >= 30) {
      return 100; // Completed at 30 check-ins
    }
    
    const checkInsInStage = totalCheckIns - currentStage.min;
    const totalNeededForStage = currentStage.max - currentStage.min + 1;
    const progress = (checkInsInStage / totalNeededForStage) * 100;
    
    return Math.min(progress, 100);
  };

  const getNextStageName = () => {
    const currentStage = getCurrentStage();
    const currentIndex = stages.indexOf(currentStage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1].name : null;
  };

  const currentStage = getCurrentStage();
  const progress = getProgressToNextStage();
  const nextStage = getNextStageName();

  return (
    <Card className="bg-slate-900/70 border border-slate-500/30 p-5 rounded-2xl shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentStage.color} flex items-center justify-center shadow-lg`}>
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">
            Consistency Journey
          </h3>
          <p className="text-xs text-slate-400">{currentStage.message}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-lg font-black bg-gradient-to-r ${currentStage.color} bg-clip-text text-transparent`}>
            {currentStage.name}
          </span>
          <span className="text-xs text-slate-400">
            {totalCheckIns} check-ins
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={progress} 
            className="h-2.5 bg-slate-700/50"
          />
          <div 
            className={`absolute top-0 left-0 h-2.5 rounded-full bg-gradient-to-r ${currentStage.color} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {nextStage && (
          <p className="text-xs text-slate-400 mt-2">
            {currentStage.max - totalCheckIns + 1} more {currentStage.max - totalCheckIns + 1 === 1 ? 'check-in' : 'check-ins'} to reach <span className="font-medium text-slate-300">{nextStage}</span>
          </p>
        )}
        {!nextStage && totalCheckIns >= 30 && (
          <p className="text-xs text-slate-300 mt-2 font-medium">
            ✨ Journey complete! You've built an amazing habit!
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <p className="text-xs text-slate-400">Your consistency journey never resets</p>
        <div className="flex gap-1">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                totalCheckIns >= stage.min ? `bg-gradient-to-r ${stage.color}` : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}