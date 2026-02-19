import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MapPin } from 'lucide-react';

export default function LocationPermissionModal({ isOpen, onClose, onLocationGranted }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableLocation = async () => {
    setIsRequesting(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onLocationGranted({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            onClose();
          },
          (error) => {
            console.warn('Location request failed:', error.message);
            // Keep modal open to retry
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto mb-4">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <AlertDialogTitle className="text-center">Enable Location</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            We need your location to verify you're at the gym and allow check-ins. This helps prevent fraudulent check-ins.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-center pt-2">
          <AlertDialogCancel>Not Now</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleEnableLocation}
            disabled={isRequesting}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {isRequesting ? 'Requesting...' : 'Enable Location'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}