import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, BookOpen, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all_levels'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function ClassForm({ initial, gymId, gymName, instructorName, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || {
    name: '', description: '', instructor: instructorName || '',
    duration_minutes: 60, max_capacity: 20, difficulty: 'all_levels',
    schedule: [{ day: 'Monday', time: '09:00' }],
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSchedule = (idx, k, v) => {
    const s = [...(form.schedule || [])];
    s[idx] = { ...s[idx], [k]: v };
    setForm(f => ({ ...f, schedule: s }));
  };
  const addSlot = () => setForm(f => ({ ...f, schedule: [...(f.schedule || []), { day: 'Monday', time: '09:00' }] }));
  const removeSlot = (i) => setForm(f => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Class Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HIIT Blast" className="bg-slate-700 border-slate-600 text-white" />
        </div>
        <div>
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Instructor</Label>
          <Input value={form.instructor} onChange={e => set('instructor', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
        </div>
        <div>
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Duration (min)</Label>
          <Input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', +e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
        </div>
        <div>
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Max Capacity</Label>
          <Input type="number" value={form.max_capacity} onChange={e => set('max_capacity', +e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
        </div>
        <div>
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Difficulty</Label>
          <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm">
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Description</Label>
          <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional" className="bg-slate-700 border-slate-600 text-white" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Schedule Slots</Label>
          <button onClick={addSlot} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">+ Add slot</button>
        </div>
        <div className="space-y-2">
          {(form.schedule || []).map((slot, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select value={slot.day} onChange={e => setSchedule(i, 'day', e.target.value)} className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm">
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <Input type="time" value={slot.time} onChange={e => setSchedule(i, 'time', e.target.value)} className="flex-1 bg-slate-700 border-slate-600 text-white" />
              {(form.schedule || []).length > 1 && (
                <button onClick={() => removeSlot(i)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={onCancel} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
        <Button onClick={() => onSave({ ...form, gym_id: gymId, gym_name: gymName })} disabled={!form.name || loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? 'Saving…' : 'Save Class'}
        </Button>
      </div>
    </div>
  );
}

export default function DashClasses({ currentUser }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['coachClasses', coachProfile?.gym_id],
    queryFn: () => base44.entities.GymClass.filter({ gym_id: coachProfile.gym_id }),
    enabled: !!coachProfile?.gym_id,
  });

  const { data: gym } = useQuery({
    queryKey: ['gym', coachProfile?.gym_id],
    queryFn: () => base44.entities.Gym.filter({ id: coachProfile.gym_id }).then(r => r[0] || null),
    enabled: !!coachProfile?.gym_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GymClass.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coachClasses'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GymClass.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coachClasses'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GymClass.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coachClasses'] }),
  });

  if (!coachProfile?.gym_id) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-semibold">No gym linked to your profile.</p>
        <p className="text-slate-500 text-sm mt-1">Join a gym in Settings to manage classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">My Classes</h2>
          <p className="text-slate-400 text-sm">{gym?.name}</p>
        </div>
        {!showForm && !editing && (
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" /> New Class
          </Button>
        )}
      </div>

      {(showForm || editing) && (
        <Card className="bg-slate-800/80 border-slate-700 p-5">
          <h3 className="font-bold text-white mb-4">{editing ? 'Edit Class' : 'Create New Class'}</h3>
          <ClassForm
            initial={editing}
            gymId={coachProfile.gym_id}
            gymName={coachProfile.gym_name || gym?.name}
            instructorName={currentUser?.full_name}
            loading={createMutation.isPending || updateMutation.isPending}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSave={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
          />
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">No classes yet</p>
          <p className="text-slate-500 text-sm mt-1">Create your first class to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map(cls => (
            <Card key={cls.id} className="bg-slate-800/60 border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{cls.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{cls.instructor}</p>
                </div>
                <Badge className="bg-slate-600/50 text-slate-300 text-xs capitalize border-0">{cls.difficulty?.replace('_',' ')}</Badge>
              </div>
              {cls.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{cls.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.duration_minutes}min</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cls.max_capacity} max</span>
              </div>
              {(cls.schedule || []).length > 0 && (
                <div className="flex gap-1 flex-wrap mb-3">
                  {cls.schedule.map((s, i) => (
                    <span key={i} className="text-xs bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full">{s.day} {s.time}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1 border-t border-slate-700">
                <button onClick={() => setEditing(cls)} className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deleteMutation.mutate(cls.id)} className="flex-1 flex items-center justify-center gap-1 text-xs text-red-400 hover:text-red-300 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}