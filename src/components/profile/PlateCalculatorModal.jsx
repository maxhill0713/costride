import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

export default function PlateCalculatorModal({ isOpen, onClose }) {
  const [targetWeight, setTargetWeight] = useState('');
  const [barWeight, setBarWeight] = useState('20');

  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];

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
          <h2 className="text-lg font-bold text-white">Plate Calculator</h2>
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
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-[10px] text-slate-400 mb-2">Per Side:</p>
                <div className="space-y-1">
                  {Object.entries(plates_needed).length > 0 ? (
                    Object.entries(plates_needed).map(([plate, count]) => (
                      <div key={plate} className="flex justify-between text-xs text-white">
                        <span>{plate}kg</span>
                        <span className="font-bold text-orange-400">x {count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Enter a weight to calculate</p>
                  )}
                </div>
              </div>

              <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3">
                <p className="text-[10px] text-slate-300">Total Weight:</p>
                <p className="text-2xl font-black text-orange-400">{total_weight.toFixed(1)} kg</p>
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