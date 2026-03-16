import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Camera, Plus, X, Star, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SPECIALTY_OPTIONS = ['Strength Training', 'Weight Loss', 'Muscle Gain', 'HIIT', 'Yoga', 'Pilates', 'Boxing', 'CrossFit', 'Rehabilitation', 'Nutrition', 'Cardio', 'Powerlifting'];

export default function DashProfile({ currentUser }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newCert, setNewCert] = useState('');
  const [newSpec, setNewSpec] = useState('');

  const { data: coachProfile } = useQuery({
    queryKey: ['coachProfile', currentUser?.email],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser.email }).then(r => r[0] || null),
    enabled: !!currentUser?.email,
  });

  useEffect(() => {
    if (coachProfile !== undefined) {
      setForm(coachProfile || {
        name: currentUser?.full_name || '',
        bio: '',
        user_email: currentUser?.email,
        specialties: [],
        certifications: [],
        experience_years: 1,
        rating: null,
        avatar_url: currentUser?.avatar_url || '',
        gym_id: null, gym_name: null,
      });
    }
  }, [coachProfile, currentUser]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (coachProfile?.id) return base44.entities.Coach.update(coachProfile.id, data);
      return base44.entities.Coach.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coachProfile'] });
      toast.success('Profile saved!');
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, avatar_url: file_url }));
    } finally { setUploading(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSpec = (s) => set('specialties', (form.specialties || []).includes(s) ? (form.specialties || []).filter(x => x !== s) : [...(form.specialties || []), s]);
  const addCert = () => { if (!newCert.trim()) return; set('certifications', [...(form.certifications || []), newCert.trim()]); setNewCert(''); };
  const removeCert = (i) => set('certifications', (form.certifications || []).filter((_, idx) => idx !== i));

  if (!form) return <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-black text-white">Coach Profile</h2>
        <p className="text-slate-400 text-sm">This appears on gym pages and is visible to members.</p>
      </div>

      {/* Avatar */}
      <Card className="bg-slate-800/60 border-slate-700 p-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {form.avatar_url
                ? <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-white" />}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-500 transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              <Camera className="w-3.5 h-3.5 text-white" />
            </label>
          </div>
          <div className="flex-1">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Display Name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="w-28">
                <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-1.5 block">Years Exp.</Label>
                <Input type="number" min={0} value={form.experience_years} onChange={e => set('experience_years', +e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
          </div>
        </div>
        {uploading && <p className="text-xs text-blue-400 mt-2">Uploading photo…</p>}
      </Card>

      {/* Bio */}
      <Card className="bg-slate-800/60 border-slate-700 p-5 space-y-3">
        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide block">Bio</Label>
        <textarea
          value={form.bio || ''}
          onChange={e => set('bio', e.target.value)}
          placeholder="Tell members about yourself, your coaching style, and your experience..."
          rows={4}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm placeholder:text-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </Card>

      {/* Specialties */}
      <Card className="bg-slate-800/60 border-slate-700 p-5 space-y-3">
        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide block">Specialties</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map(s => {
            const on = (form.specialties || []).includes(s);
            return (
              <button key={s} onClick={() => toggleSpec(s)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all border ${on ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}>
                {s}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Certifications */}
      <Card className="bg-slate-800/60 border-slate-700 p-5 space-y-3">
        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wide block">Certifications</Label>
        <div className="flex gap-2">
          <Input value={newCert} onChange={e => setNewCert(e.target.value)} placeholder="e.g. NASM-CPT" onKeyDown={e => e.key === 'Enter' && addCert()} className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
          <Button onClick={addCert} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1 flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        {(form.certifications || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(form.certifications || []).map((cert, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-300 border border-amber-500/25 px-3 py-1.5 rounded-full font-medium">
                <Award className="w-3 h-3" />{cert}
                <button onClick={() => removeCert(i)} className="text-amber-400/60 hover:text-amber-300 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-bold">
        {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
      </Button>
    </div>
  );
}