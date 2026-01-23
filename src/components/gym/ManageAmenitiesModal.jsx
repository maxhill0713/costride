import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const availableAmenities = [
  'Free Parking',
  'Showers',
  'Lockers',
  'WiFi',
  'Personal Training',
  'Group Classes',
  'Sauna',
  'Steam Room',
  'Swimming Pool',
  'Basketball Court',
  'Boxing Ring',
  'MMA Cage',
  'Juice Bar',
  'Pro Shop',
  'Childcare',
  '24/7 Access',
  'Air Conditioning',
  'Towel Service',
  'Recovery Zone',
  'Cardio Cinema'
];

export default function ManageAmenitiesModal({ open, onClose, amenities = [], onSave, isLoading }) {
  const [selectedAmenities, setSelectedAmenities] = useState(amenities);

  const handleToggle = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = () => {
    onSave(selectedAmenities);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Manage Amenities</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select all amenities available at your gym</p>

          <div className="grid grid-cols-2 gap-3">
            {availableAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => handleToggle(amenity)}
                />
                <Label htmlFor={amenity} className="cursor-pointer">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold h-12 rounded-2xl"
          >
            {isLoading ? 'Saving...' : 'Save Amenities'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}