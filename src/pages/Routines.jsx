import React from 'react';
import { Calendar, Dumbbell, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';

const routines = [
  {
    id: 1,
    name: 'Push Day',
    exercises: ['Bench Press', 'Overhead Press', 'Dips'],
    duration: '60 min',
    difficulty: 'Intermediate',
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 2,
    name: 'Pull Day',
    exercises: ['Deadlift', 'Pull-ups', 'Barbell Row'],
    duration: '60 min',
    difficulty: 'Advanced',
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 3,
    name: 'Leg Day',
    exercises: ['Squat', 'Leg Press', 'Lunges'],
    duration: '75 min',
    difficulty: 'Advanced',
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 4,
    name: 'Upper Body',
    exercises: ['Bench Press', 'Rows', 'Shoulder Press'],
    duration: '50 min',
    difficulty: 'Beginner',
    color: 'from-green-400 to-emerald-500'
  }
];

export default function Routines() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Workout Routines</h1>
        </div>

        <div className="grid gap-4">
          {routines.map((routine) => (
            <Card key={routine.id} className="bg-white border-2 border-gray-100 p-5 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{routine.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Dumbbell className="w-4 h-4" />
                    <span>{routine.duration}</span>
                    <span>•</span>
                    <span>{routine.difficulty}</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${routine.color} flex items-center justify-center shadow-md`}>
                  <Flame className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {routine.exercises.map((exercise, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {exercise}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}