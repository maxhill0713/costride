import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Plus, Clock } from 'lucide-react';

export default function ManageClassesModal({ open, onClose, classes = [], onCreateClass, onDeleteClass, gym, isLoading }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructor: '',
    duration_minutes: 60,
    difficulty: 'all_levels',
    max_capacity: 20,
    schedule: []
  });
  const [scheduleDay, setScheduleDay] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const addScheduleSlot = () => {
    if (scheduleDay && scheduleTime) {
      setFormData({
        ...formData,
        schedule: [...formData.schedule, { day: scheduleDay, time: scheduleTime }]
      });
      setScheduleDay('');
      setScheduleTime('');
    }
  };

  const removeScheduleSlot = (index) => {
    setFormData({
      ...formData,
      schedule: formData.schedule.filter((_, i) => i !== index)
    });
  };

  const handleCreate = () => {
    onCreateClass({
      ...formData,
      gym_id: gym.id,
      gym_name: gym.name
    });
    setFormData({
      name: '',
      description: '',
      instructor: '',
      duration_minutes: 60,
      difficulty: 'all_levels',
      max_capacity: 20,
      schedule: []
    });
    setShowCreateForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-500" />
            Manage Classes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Class
            </Button>
          )}

          {showCreateForm && (
            <Card className="p-4 bg-purple-50 border-2 border-purple-200">
              <h3 className="font-bold text-gray-900 mb-4">New Class</h3>
              <div className="space-y-3">
                <div>
                  <Label>Class Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., HIIT Bootcamp"
                    className="rounded-2xl"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Class details..."
                    className="rounded-2xl"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Instructor *</Label>
                    <Input
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      placeholder="Instructor name"
                      className="rounded-2xl"
                    />
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="all_levels">All Levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                      className="rounded-2xl"
                    />
                  </div>

                  <div>
                    <Label>Max Capacity</Label>
                    <Input
                      type="number"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 0 })}
                      className="rounded-2xl"
                    />
                  </div>
                </div>

                <div>
                  <Label>Schedule</Label>
                  <div className="flex gap-2 mb-2">
                    <Select value={scheduleDay} onValueChange={setScheduleDay}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="rounded-2xl"
                    />
                    <Button type="button" onClick={addScheduleSlot} variant="outline" className="rounded-2xl">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.schedule.length > 0 && (
                    <div className="space-y-1">
                      {formData.schedule.map((slot, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg">
                          <span className="text-sm">{slot.day} at {slot.time}</span>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeScheduleSlot(idx)}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name || !formData.instructor || isLoading}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-2xl"
                  >
                    {isLoading ? 'Creating...' : 'Create Class'}
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
            <h3 className="font-bold text-gray-900">Existing Classes ({classes.length})</h3>
            {classes.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No classes created yet</p>
              </Card>
            ) : (
              classes.map((gymClass) => (
                <Card key={gymClass.id} className="p-4 bg-white border-2 border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{gymClass.name}</h4>
                      {gymClass.description && (
                        <p className="text-sm text-gray-600 mt-1">{gymClass.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>{gymClass.instructor}</Badge>
                        {gymClass.difficulty && (
                          <Badge variant="outline" className="capitalize">
                            {gymClass.difficulty.replace('_', ' ')}
                          </Badge>
                        )}
                        {gymClass.duration_minutes && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {gymClass.duration_minutes} min
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteClass(gymClass.id)}
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