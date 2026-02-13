import React from 'react';
import NotificationSettingsContent from './NotificationSettingsContent';
import PrivacySettingsContent from './PrivacySettingsContent';
import AccountSettingsContent from './AccountSettingsContent';
import ProfileSettingsContent from './ProfileSettingsContent';
import AppearanceSettingsContent from './AppearanceSettingsContent';
import HelpSupportContent from './HelpSupportContent';

export default function SearchSettingsDisplay({ setting, searchQuery }) {
  if (!setting) return null;

  const componentMap = {
    'NotificationSettings': <NotificationSettingsContent searchQuery={searchQuery} />,
    'PrivacySettings': <PrivacySettingsContent searchQuery={searchQuery} />,
    'AccountSettings': <AccountSettingsContent searchQuery={searchQuery} />,
    'ProfileSettings': <ProfileSettingsContent searchQuery={searchQuery} />,
    'AppearanceSettings': <AppearanceSettingsContent searchQuery={searchQuery} />,
    'SubscriptionSettings': null,
    'HelpSupport': <HelpSupportContent searchQuery={searchQuery} />
  };

  return (
    <div className="mb-6 max-w-2xl mx-auto px-4 py-6">
      {componentMap[setting.page]}
    </div>
  );
}