import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PlateCalculatorModal({ isOpen, onClose }) {
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState('20');
  const [inventory] = useState('standard'); // standard or powerlifting

  // Standard Gym: max 20kg plates
  const plates = inventory === 'standard' ? [20, 15, 10, 5, 2.5, 1.25] : [25, 20, 15, 10, 5, 2.5, 1.25];

  const calculatePlates = () => {
    const target = parseFloat(targetWeight) || 0;
    const bar = parseFloat(barWeight) || 20;
    let remaining = (target - bar) / 2;

    if (remaining < 0) return {};

    const result = {};
    plates.forEach(plate => {
      const count = Math.floor(remaining / plate);
      if (count > 0) {
        result[plate] = count;
        remaining = Math.round((remaining - count * plate) * 100) / 100;
      }
    });

    return result;
  };

  const plates_needed = calculatePlates();
  const total_weight = Object.entries(plates_needed).reduce((sum, [plate, count]) => sum + parseFloat(plate) * count * 2, parseFloat(barWeight) || 20);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Plate Calculator</h2>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
              Standard Gym
            </Badge>
          </div>
          <Button onClick={onClose} size="icon" variant="ghost" className="w-5 h-5 text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Target Weight (kg)</label>
            <Input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="e.g., 100"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Bar Weight (kg)</label>
            <Input
              type="number"
              value={barWeight}
              onChange={(e) => setBarWeight(e.target.value)}
              placeholder="e.g., 20"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {targetWeight && (
            <>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-300">Plates per side:</p>
                  <p className="text-[10px] text-slate-400">Max 20kg plates</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(plates_needed).length > 0 ? (
                    Object.entries(plates_needed).map(([plate, count]) => (
                      <div key={plate} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-2.5 border border-slate-600/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{plate}</span>
                          </div>
                          <span className="text-sm text-white font-medium">{plate}kg plate</span>
                        </div>
                        <span className="text-lg font-black text-orange-400">x{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">Enter a weight to calculate</p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-300 mb-1">Total Weight</p>
                    <p className="text-3xl font-black text-orange-400">{total_weight.toFixed(1)}<span className="text-lg text-orange-300/70 ml-1">kg</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Bar: {barWeight}kg</p>
                    <p className="text-[10px] text-slate-400">Plates: {(total_weight - parseFloat(barWeight)).toFixed(1)}kg</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-4 bg-slate-700 hover:bg-slate-600">
          Close
        </Button>
      </div>
    </div>
  );
}