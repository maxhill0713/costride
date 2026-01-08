import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Trash2, Plus, X } from 'lucide-react';

export default function ManageCoachesModal({ open, onClose, coaches = [], onCreateCoach, onDeleteCoach, gym, isLoading }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar_url: '',
    specialties: [],
    certifications: [],
    experience_years: 0,
    rating: 5
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const addSpecialty = () => {
    if (newSpecialty && !formData.specialties.includes(newSpecialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  const addCertification = () => {
    if (newCertification && !formData.certifications.includes(newCertification)) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification]
      });
      setNewCertification('');
    }
  };

  const removeCertification = (cert) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter(c => c !== cert)
    });
  };

  const handleCreate = () => {
    onCreateCoach({
      ...formData,
      gym_id: gym.id,
      gym_name: gym.name,
      total_clients: 0
    });
    setFormData({
      name: '',
      bio: '',
      avatar_url: '',
      specialties: [],
      certifications: [],
      experience_years: 0,
      rating: 5
    });
    setShowCreateForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            Manage Coaches
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Coach
            </Button>
          )}

          {showCreateForm && (
            <Card className="p-4 bg-blue-50 border-2 border-blue-200">
              <h3 className="font-bold text-gray-900 mb-4">New Coach</h3>
              <div className="space-y-3">
                <div>
                  <Label>Coach Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="rounded-2xl"
                  />
                </div>

                <div>
                  <Label>Bio</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Coach bio and background..."
                    className="rounded-2xl"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Profile Photo URL</Label>
                  <Input
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://..."
                    className="rounded-2xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Years of Experience</Label>
                    <Input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                      className="rounded-2xl"
                    />
                  </div>

                  <div>
                    <Label>Rating (out of 5)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                      className="rounded-2xl"
                    />
                  </div>
                </div>

                <div>
                  <Label>Specialties</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      placeholder="e.g., Strength Training"
                      className="rounded-2xl"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                    />
                    <Button type="button" onClick={addSpecialty} variant="outline" className="rounded-2xl">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-700 flex items-center gap-1">
                          {specialty}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeSpecialty(specialty)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Certifications</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="e.g., NASM-CPT"
                      className="rounded-2xl"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                    />
                    <Button type="button" onClick={addCertification} variant="outline" className="rounded-2xl">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="outline" className="flex items-center gap-1">
                          {cert}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeCertification(cert)} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name || isLoading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-2xl"
                  >
                    {isLoading ? 'Adding...' : 'Add Coach'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="rounded-2xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Current Coaches ({coaches.length})</h3>
            {coaches.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No coaches added yet</p>
              </Card>
            ) : (
              coaches.map((coach) => (
                <Card key={coach.id} className="p-4 bg-white border-2 border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{coach.name}</h4>
                      {coach.bio && (
                        <p className="text-sm text-gray-600 mt-1">{coach.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {coach.specialties && coach.specialties.map((spec, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-700">{spec}</Badge>
                        ))}
                        {coach.experience_years > 0 && (
                          <Badge variant="outline">{coach.experience_years} years</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteCoach(coach.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}