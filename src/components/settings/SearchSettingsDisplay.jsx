import React from 'react';
import NotificationSettingsContent from './NotificationSettingsContent';
import PrivacySettingsContent from './PrivacySettingsContent';
import AccountSettingsContent from './AccountSettingsContent';
import ProfileSettingsContent from './ProfileSettingsContent';
import AppearanceSettingsContent from './AppearanceSettingsContent';
import HelpSupportContent from './HelpSupportContent';

export default function SearchSettingsDisplay({ setting }) {
  if (!setting) return null;

  const componentMap = {
    'NotificationSettings': <NotificationSettingsContent />,
    'PrivacySettings': <PrivacySettingsContent />,
    'AccountSettings': <AccountSettingsContent />,
    'ProfileSettings': <ProfileSettingsContent />,
    'AppearanceSettings': <AppearanceSettingsContent />,
    'SubscriptionSettings': null,
    'HelpSupport': <HelpSupportContent />
  };

  return (
    <div className="mb-6 max-w-2xl mx-auto px-4 py-6">
      {componentMap[setting.page]}
    </div>
  );
}