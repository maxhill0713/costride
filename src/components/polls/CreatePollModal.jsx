import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreatePollModal({ open, onClose, onSave, isLoading }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [description, setDescription] = useState('');

  const categories = [
    { value: 'equipment_replacement', label: '🔧 Most Popular Gym Equipment Replacement' },
    { value: 'favorite_equipment', label: '💪 Favorite Pieces of Equipment' },
    { value: 'rewards', label: '🎁 What Rewards Would You Like?' },
    { value: 'playlist', label: '🎵 What Songs Would You Like to Add to Gym Playlist?' }
  ];

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!title.trim() || !category || options.filter(o => o.trim()).length < 2) {
      alert('Please fill in all fields with at least 2 options');
      return;
    }

    onSave({
      title,
      description,
      category,
      options: options.filter(o => o.trim()).map((text) => ({
        id: Math.random().toString(36).substr(2, 9),
        text: text.trim(),
        votes: 0
      }))
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('');
    setOptions(['', '']);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create a Poll</DialogTitle>
          <DialogDescription className="text-slate-400">
            Ask your members what they think. Choose a category or write your own question.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">Poll Type</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select a poll type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">Question</label>
            <Input
              placeholder="e.g., Which equipment should we replace?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">Details (Optional)</label>
            <Input
              placeholder="Add any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-sm font-semibold text-slate-200 mb-2 block">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Option Button */}
          <Button
            variant="outline"
            onClick={handleAddOption}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Creating...' : 'Create Poll'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}