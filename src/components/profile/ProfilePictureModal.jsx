import React from 'react';
import { X } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, imageUrl, userName, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Cards */}
      {children && (
        <div 
          className="mt-12 mb-8 w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}