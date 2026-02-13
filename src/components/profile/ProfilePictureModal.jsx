import React from 'react';
import { X } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, imageUrl, userName }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Profile Picture */}
      <div 
        className="relative max-w-2xl w-full aspect-square"
        onClick={(e) => e.stopPropagation()}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={userName}
            className="w-full h-full object-cover rounded-2xl shadow-2xl"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-[120px] font-bold text-white">
              {userName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* User Name */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full">
        <p className="text-white font-semibold text-lg">{userName}</p>
      </div>
    </div>
  );
}