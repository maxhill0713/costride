import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// OneSignal App ID — get from environment or use fallback
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '9b5b68c2-c473-49eb-b74e-eac55368db3b';

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
          allowLocalhostAsSecureOrigin: true,
        });

        // Get user and login immediately after init
        const user = await base44.auth.me().catch(() => null);
        if (user?.id) {
          await OneSignal.login(user.id);
          console.log('OneSignal: user logged in with ID', user.id);
        } else {
          console.warn('OneSignal: no user found to login');
        }

        // Listen for permission grant event from index.html
        window.addEventListener('onesignalPermissionGranted', async () => {
          const currentUser = await base44.auth.me().catch(() => null);
          if (currentUser?.id) {
            await OneSignal.login(currentUser.id);
            console.log('OneSignal: user logged in after permission granted', currentUser.id);
          }
        });

        // Handle notification clicks
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('Notification clicked:', event.notification);
          const { custom_data } = event.notification.data || {};
          if (custom_data?.route) {
            window.location.href = custom_data.route;
          }
        });

        // Handle notification dismissed
        OneSignal.Notifications.addEventListener('dismiss', (event) => {
          console.log('Notification dismissed:', event.notification.id);
        });
      } catch (err) {
        console.warn('OneSignal init error:', err.message);
      }
    });
  }, []);

  return null;
}