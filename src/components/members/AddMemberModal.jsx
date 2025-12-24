import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from 'lucide-react';

export default function AddMemberModal({ open, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    weight_class: 'middleweight',
    join_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white text-gray-900 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-green-500" />
            Add New Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Full Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Smith"
              required
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Gym Nickname</Label>
            <Input
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="The Beast"
              className="bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Weight Class</Label>
            <Select
              value={formData.weight_class}
              onValueChange={(value) => setFormData({ ...formData, weight_class: value })}
            >
              <SelectTrigger className="bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-2xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200">
                <SelectItem value="lightweight">Lightweight</SelectItem>
                <SelectItem value="middleweight">Middleweight</SelectItem>
                <SelectItem value="heavyweight">Heavyweight</SelectItem>
                <SelectItem value="super_heavyweight">Super Heavyweight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.name}
            className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold h-14 rounded-2xl shadow-md text-base"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                Add Member
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}