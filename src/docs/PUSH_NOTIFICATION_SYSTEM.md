# Push Notification System

Automated push notifications for member engagement and retention.

## System Overview

The system sends two types of automated notifications:

### 1. **Inactivity Reminders** (Daily at 9:00 AM UTC)
- **Trigger**: Members inactive for 7+ days
- **Function**: `sendInactivityPushReminders`
- **Automation**: Runs daily via scheduled task
- **Messages**: Randomly selected motivational reminders to re-engage members
- **Created**: In-app notification + OneSignal push notification

**Example Messages:**
- "We miss you 💪 — It's been a while! Your streak is waiting — get back to the gym today."
- "Don't let the streak die ⚡ — It's been 7+ days. Get back in there — your future self will thank you."

---

### 2. **Streak Milestones** (Real-time on check-in)
- **Trigger**: Member achieves 7, 14, 30, 60, 90, 100, or 365 day streaks
- **Function**: `sendStreakMilestoneNotification`
- **Automation**: Entity automation (fires on CheckIn creation)
- **Messages**: Congratulatory messages matched to milestone

**Milestones & Messages:**
- **7 days**: "🔥 One Week Strong! You've hit a 7-day streak! Consistency is starting to stick."
- **14 days**: "🚀 Two Weeks Crushing It! A 14-day streak shows real commitment."
- **30 days**: "🏆 One Month Champion! A full month of consistency — you're unstoppable!"
- **60 days**: "💪 Two Months of Legends! You've reached 60 days. Your dedication is inspiring."
- **90 days**: "⭐ Three Months of Excellence! A 90-day streak is legendary. You're in the top 1%."
- **100 days**: "👑 Century Club! 100 days! You've reached an elite milestone."
- **365 days**: "🌟 One Year of Consistency! A full year of never missing a day. You're an absolute champion!"

---

## Architecture

### Backend Functions

**`sendInactivityPushReminders`**
- Identifies members with no check-ins in the last 7 days
- Creates in-app `Notification` records
- Invokes `sendOneSignalPush` to send real push notifications
- Logs all notifications for tracking

**`sendStreakMilestoneNotification`**
- Triggered when a CheckIn is created
- Fetches the user's current streak
- Matches streak against milestone thresholds
- Creates in-app notification + push notification if milestone matched
- Skips silently if streak is not a milestone

**`sendOneSignalPush`**
- Universal push notification sender
- Batches up to 2000 user IDs per OneSignal API request
- Supports custom metadata/data payloads
- Handles errors gracefully with fallback logging

### Notification Entity

Both systems create records in the `Notification` entity:

```json
{
  "user_id": "user_uuid",
  "type": "inactivity_reminder" | "streak_milestone",
  "title": "Notification Title",
  "message": "Notification Body",
  "read": false
}
```

The `Notification` bell in the app UI displays these in-app notifications.

---

## Configuration

### Inactivity Reminder Timing
- **Schedule**: Daily at 09:00 UTC (3:00 AM ET / 4:00 AM UK)
- **Inactivity Threshold**: 7 days without check-in
- **OneSignal Integration**: Required (API key + App ID in secrets)

### Streak Milestones
- **Trigger**: Automatic on CheckIn creation
- **Milestones**: 7, 14, 30, 60, 90, 100, 365 days
- **User Data**: Requires `current_streak` field on User entity

---

## OneSignal Setup

Both functions rely on OneSignal for push notifications. Required secrets:

- `ONESIGNAL_APP_ID` - App identifier
- `ONESIGNAL_REST_API_KEY` - REST API authentication key

The system targets users by their `external_id` (Base44 user ID).

---

## Testing

### Test Inactivity Reminders
```javascript
// Invoke manually to trigger immediately
await base44.functions.invoke('sendInactivityPushReminders', {})
```

### Test Streak Milestones
1. Create a CheckIn for a user with `current_streak: 7`
2. Monitor logs for notification creation
3. Verify in-app notification and OneSignal delivery

---

## Troubleshooting

**No notifications sent?**
1. Verify OneSignal secrets are set and valid
2. Check that OneSignal external_id is properly linked to user IDs
3. Review backend function logs for errors

**Inactivity reminders not running?**
1. Verify the scheduled automation is active (status: active)
2. Check the automation last_run_at timestamp
3. Review logs in the function editor

**Streak milestones not firing?**
1. Verify user has `current_streak` field populated
2. Confirm CheckIn creation triggers the entity automation
3. Check logs for "not a milestone" messages (expected for non-milestone streaks)