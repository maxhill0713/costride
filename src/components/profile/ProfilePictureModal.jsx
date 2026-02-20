import React from 'react';
import { X } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, imageUrl, userName, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Container with Profile Picture and Cards */}
      <div 
        className="relative flex flex-col items-center mt-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cards Container - Behind Profile Picture */}
        {children && (
          <div 
            className="w-80 md:w-96 mb-8"
          >
            {children}
          </div>
        )}

        {/* Profile Picture - On Top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 md:w-96 md:h-96 -mt-32"
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

        {/* Spacing for the overlapped profile picture */}
        <div className="h-80 md:h-96" />
      </div>
    </div>
  );
}