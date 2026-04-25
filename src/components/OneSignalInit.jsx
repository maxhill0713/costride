import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * OneSignal React Init Component
 * 
 * IMPORTANT: index.html already handles OneSignal.init().
 * This component ONLY handles:
 * 1. Logging in the base44 user after init is complete
 * 2. Listening for notification click events
 * 
 * DO NOT call OneSignal.init() here — it's called in index.html
 * to avoid the double-init bug which breaks mobile push.
 */
export default function OneSignalInit() {
  useEffect(() => {
    if (!window.OneSignalDeferred) return;

    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        // Login the base44 user so we can target them by ID
        const user = await base44.auth.me().catch(() => null);
        if (user?.id) {
          await OneSignal.login(user.id);
          console.log('OneSignal: user logged in with ID', user.id);
        } else {
          console.warn('OneSignal: no user found to login');
        }

        // Re-login after permission is granted (covers the case where user
        // grants permission before we fetched their base44 ID)
        window.addEventListener('onesignalPermissionGranted', async () => {
          const currentUser = await base44.auth.me().catch(() => null);
          if (currentUser?.id) {
            await OneSignal.login(currentUser.id);
            console.log('OneSignal: user logged in after permission granted', currentUser.id);
          }
        });

        // Handle notification clicks → navigate to route
        OneSignal.Notifications.addEventListener('click', (event) => {
          const route = event?.notification?.data?.custom_data?.route;
          if (route) window.location.href = route;
        });

      } catch (err) {
        console.warn('OneSignalInit: error', err.message);
      }
    });
  }, []);

  return null;
}