import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Trash2, Plus } from 'lucide-react';

export default function ManageRewardsModal({ open, onClose, rewards = [], onCreateReward, onDeleteReward, gym, isLoading }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'discount',
    requirement: 'points',
    points_required: 0,
    value: '',
    icon: '🎁'
  });

  const handleCreate = () => {
    onCreateReward({
      ...formData,
      gym_id: gym.id,
      gym_name: gym.name,
      active: true,
      claimed_by: []
    });
    setFormData({
      title: '',
      description: '',
      type: 'discount',
      requirement: 'points',
      points_required: 0,
      value: '',
      icon: '🎁'
    });
    setShowCreateForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-500" />
            Manage Rewards
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Reward Button */}
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Reward
            </Button>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <Card className="p-4 bg-purple-50 border-2 border-purple-200">
              <h3 className="font-bold text-gray-900 mb-4">New Reward</h3>
              <div className="space-y-3">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Free Protein Shake"
                    className="rounded-2xl"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details about this reward..."
                    className="rounded-2xl"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="free_class">Free Class</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                        <SelectItem value="free_day_pass">Free Day Pass</SelectItem>
                        <SelectItem value="personal_training">Personal Training</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Requirement *</Label>
                    <Select value={formData.requirement} onValueChange={(value) => setFormData({ ...formData, requirement: value })}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="points">Points</SelectItem>
                        <SelectItem value="check_ins_10">10 Check-ins</SelectItem>
                        <SelectItem value="check_ins_50">50 Check-ins</SelectItem>
                        <SelectItem value="streak_30">30-Day Streak</SelectItem>
                        <SelectItem value="challenge_winner">Challenge Winner</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="none">None (Always Available)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {formData.requirement === 'points' && (
                    <div>
                      <Label>Points Required</Label>
                      <Input
                        type="number"
                        value={formData.points_required}
                        onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })}
                        className="rounded-2xl"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Value</Label>
                    <Input
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="e.g., £10 off"
                      className="rounded-2xl"
                    />
                  </div>

                  <div>
                    <Label>Icon (Emoji)</Label>
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="rounded-2xl text-2xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.title || !formData.type || isLoading}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 rounded-2xl"
                  >
                    {isLoading ? 'Creating...' : 'Create Reward'}
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

          {/* Existing Rewards */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Active Rewards ({rewards.filter(r => r.active).length})</h3>
            {rewards.filter(r => r.active).length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No rewards created yet</p>
              </Card>
            ) : (
              rewards.filter(r => r.active).map((reward) => (
                <Card key={reward.id} className="p-4 bg-white border-2 border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{reward.icon || '🎁'}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{reward.title}</h4>
                      {reward.description && (
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="capitalize">{reward.type.replace('_', ' ')}</Badge>
                        <Badge variant="outline" className="capitalize">
                          {reward.requirement.replace('_', ' ')}
                        </Badge>
                        {reward.value && (
                          <Badge className="bg-green-100 text-green-700">{reward.value}</Badge>
                        )}
                        {reward.claimed_by && reward.claimed_by.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-700">
                            {reward.claimed_by.length} claimed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteReward(reward.id)}
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