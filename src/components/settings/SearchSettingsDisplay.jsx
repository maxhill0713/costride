import React from 'react';
import NotificationSettings from '@/pages/NotificationSettings';
import PrivacySettings from '@/pages/PrivacySettings';
import AccountSettings from '@/pages/AccountSettings';
import ProfileSettings from '@/pages/ProfileSettings';
import AppearanceSettings from '@/pages/AppearanceSettings';
import SubscriptionSettings from '@/pages/SubscriptionSettings';
import HelpSupport from '@/pages/HelpSupport';

export default function SearchSettingsDisplay({ setting }) {
  if (!setting) return null;

  const componentMap = {
    'NotificationSettings': <NotificationSettings />,
    'PrivacySettings': <PrivacySettings />,
    'AccountSettings': <AccountSettings />,
    'ProfileSettings': <ProfileSettings />,
    'AppearanceSettings': <AppearanceSettings />,
    'SubscriptionSettings': <SubscriptionSettings />,
    'HelpSupport': <HelpSupport />
  };

  return (
    <div className="mb-6">
      {componentMap[setting.page]}
    </div>
  );
}