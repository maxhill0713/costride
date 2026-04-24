import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// OneSignal App ID — must match the secret ONESIGNAL_APP_ID
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

/**
 * Initialises OneSignal and registers the current user's device token.
 * We set external_id = base44 user ID so the backend can target users by ID.
 * Drop this component anywhere inside AuthProvider (it renders nothing).
 */
export default function OneSignalInit() {
  useEffect(() => {
    if (!window.OneSignalDeferred) return;

    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          // Allow prompting on first visit
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: 'push',
                  autoPrompt: true,
                  text: {
                    actionMessage: 'Stay connected with your gym community — enable notifications.',
                    acceptButton: 'Allow',
                    cancelButton: 'Not now',
                  },
                },
              ],
            },
          },
          notifyButton: { enable: false },
          // Required for Safari on iOS (PWA)
          safari_web_id: '',
        });

        // Link the OneSignal device to the authenticated base44 user
        const user = await base44.auth.me().catch(() => null);
        if (user?.id) {
          await OneSignal.login(user.id);
          console.log('OneSignal: linked device to user', user.id);
        }
      } catch (err) {
        console.warn('OneSignal init error:', err.message);
      }
    });
  }, []);

  return null;
}