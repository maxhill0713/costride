import React, { useState } from 'react';
import { Bell } from 'lucide-react';

export default function OneSignalPromptButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    if (!window._OneSignalShowPrompt) {
      console.error('OneSignal: not initialized yet');
      return;
    }
    
    setIsLoading(true);
    try {
      await window._OneSignalShowPrompt();
    } catch (err) {
      console.error('OneSignal: prompt error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleEnableNotifications}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 disabled:opacity-50"
    >
      <Bell className="w-4 h-4" />
      {isLoading ? 'Enabling...' : 'Enable Notifications'}
    </button>
  );
}