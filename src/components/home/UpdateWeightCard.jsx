import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Edit2, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function UpdateWeightCard({ currentUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState(currentUser?.current_weight || '');
  const [unit, setUnit] = useState(currentUser?.weight_unit || 'kg');
  const queryClient = useQueryClient();

  const updateWeightMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    if (!weight || parseFloat(weight) <= 0) return;
    updateWeightMutation.mutate({
      current_weight: parseFloat(weight),
      weight_unit: unit
    });
  };

  const handleCancel = () => {
    setWeight(currentUser?.current_weight || '');
    setUnit(currentUser?.weight_unit || 'kg');
    setIsEditing(false);
  };

  return (
    <Card className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 p-5 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold">Body Weight</p>
            <p className="text-2xl font-bold text-white">
              {currentUser?.current_weight ? `${currentUser.current_weight} ${currentUser.weight_unit || 'kg'}` : 'Not set'}
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 flex gap-2">
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight"
            step="0.1"
            className="bg-slate-700/50 border-slate-600 text-white rounded-lg"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-lg text-sm font-medium"
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
          <Button
            onClick={handleSave}
            disabled={!weight || parseFloat(weight) <= 0 || updateWeightMutation.isPending}
            size="icon"
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleCancel}
            size="icon"
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}