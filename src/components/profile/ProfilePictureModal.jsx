import React from 'react';
import { X } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, imageUrl, userName }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-12 p-4"
      onClick={onClose}
    >
      {/* Profile Picture */}
      <div 
        className="relative w-80 h-80 md:w-96 md:h-96"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={userName}
            className="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-white/20"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
            <span className="text-[160px] font-bold text-white">
              {userName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}