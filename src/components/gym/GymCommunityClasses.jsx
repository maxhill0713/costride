import React from 'react';
import ClassesTabContent from './ClassesTabContent';

const CARD_STYLE = { background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 2px 12px rgba(0,0,0,0.35)' };

export default function GymCommunityClasses({
  isGhostGym,
  classes,
  showOwnerControls,
  onManage,
  onDelete,
  currentUser,
  gymId,
  autoOpenClassId
}) {
  return (
    <div className="space-y-3 mt-0 w-full">
      {isGhostGym &&
      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(219,39,119,0.12))', border: '1px solid rgba(139,92,246,0.3)' }}>
        <p className="text-sm font-bold text-white mb-0.5">This isn't an official community yet!</p>
        <p className="text-xs text-slate-400 leading-relaxed">Get your gym involved to unlock classes, coaches & more features. Use the "Make Official" button above to get started.</p>
      </div>
      }
      {!isGhostGym && <ClassesTabContent
        classes={classes}
        showOwnerControls={showOwnerControls}
        onManage={onManage}
        onDelete={onDelete}
        currentUser={currentUser}
        gymId={gymId}
        autoOpenClassId={autoOpenClassId}
      />}
    </div>
  );
}