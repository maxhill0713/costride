import React from 'react';
import { X } from 'lucide-react';

export default function ProfilePictureModal({ isOpen, onClose, imageUrl, userName, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-start p-4 overflow-y-auto pt-12"
      onClick={onClose}
    >
      <div 
        className="flex flex-col items-center gap-6 w-full max-w-sm pb-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Picture */}
        <div className="w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={userName}
              className="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-white/20"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/20">
              <span className="text-8xl font-bold text-white">
                {userName?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Cards below */}
        {children && (
          <div className="w-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}