import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Dumbbell } from 'lucide-react';

export default function ManageEquipmentModal({ open, onClose, equipment = [], onSave, isLoading }) {
  const [equipmentList, setEquipmentList] = useState(equipment);
  const [newEquipment, setNewEquipment] = useState('');

  const handleAdd = () => {
    if (newEquipment.trim() && !equipmentList.includes(newEquipment.trim())) {
      setEquipmentList([...equipmentList, newEquipment.trim()]);
      setNewEquipment('');
    }
  };

  const handleRemove = (item) => {
    setEquipmentList(equipmentList.filter(e => e !== item));
  };

  const handleSubmit = () => {
    onSave(equipmentList);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-blue-500" />
            Manage Equipment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-900 font-medium">
              Add specific equipment available at your gym. Be detailed! Include brand names and models.
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Examples: "Hammer Strength Chest Supported Row", "Prime Lateral Raise Machine", "Rogue Echo Bike"
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              value={newEquipment}
              onChange={(e) => setNewEquipment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g., Hammer Strength Chest Supported Row"
              className="rounded-2xl flex-1"
            />
            <Button 
              onClick={handleAdd}
              className="bg-blue-500 hover:bg-blue-600 rounded-2xl"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {equipmentList.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700">Your Equipment ({equipmentList.length})</p>
              <div className="flex flex-wrap gap-2">
                {equipmentList.map((item, idx) => (
                  <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-900 border-purple-200 px-3 py-2 text-sm">
                    {item}
                    <button
                      onClick={() => handleRemove(item)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? 'Saving...' : 'Save Equipment List'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}