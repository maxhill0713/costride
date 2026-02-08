import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function WorkoutNotesModal({ isOpen, onClose, workoutName }) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, workoutName]);

  const loadNotes = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      const workout_notes = user?.workout_notes || {};
      setNotes(workout_notes[workoutName] || '');
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      const workout_notes = user?.workout_notes || {};
      workout_notes[workoutName] = notes;
      await base44.auth.updateMe({ workout_notes });
      onClose();
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Workout Notes</h2>
          <Button onClick={onClose} size="icon" variant="ghost" className="w-5 h-5 text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-400">{workoutName}</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your workout, form tips, or progress..."
            className="bg-slate-800 border-slate-700 text-white min-h-[200px] resize-none"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
          <Button onClick={onClose} variant="ghost" className="flex-1 text-slate-400">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}