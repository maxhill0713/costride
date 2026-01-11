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
    name: 'Gym Regular',
    min: 20,
    max: 29,
    color: 'from-purple-400 to-pink-500',
    message: 'Consistency is your superpower'
  },
  {
    name: 'Go Fittie',
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
    <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentStage.color} flex items-center justify-center shadow-lg`}>
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
            Consistency Journey
          </h3>
          <p className="text-sm text-slate-300">{currentStage.message}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xl font-black bg-gradient-to-r ${currentStage.color} bg-clip-text text-transparent`}>
            {currentStage.name}
          </span>
          <span className="text-sm text-slate-400">
            {totalCheckIns} check-ins
          </span>
        </div>
        
        <div className="relative">
          <Progress 
            value={progress} 
            className="h-3 bg-slate-700"
          />
          <div 
            className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${currentStage.color} transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {nextStage && (
          <p className="text-xs text-slate-400 mt-2">
            {currentStage.max - totalCheckIns + 1} more {currentStage.max - totalCheckIns + 1 === 1 ? 'check-in' : 'check-ins'} to reach <span className="font-bold text-slate-300">{nextStage}</span>
          </p>
        )}
        {!nextStage && totalCheckIns >= 30 && (
          <p className="text-xs text-slate-300 mt-2 font-medium">
            ✨ Journey complete! You've built an amazing habit!
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
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