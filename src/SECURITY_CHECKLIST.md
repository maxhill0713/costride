# PRODUCTION SECURITY CHECKLIST
## Gym Owner Dashboard - Pre-Launch Requirements

### TIER 1: CRITICAL (MUST FIX BEFORE LAUNCH)
- [ ] **1.1** RLS on GymMembership ✅ PATCHED
- [ ] **1.2** RLS on CheckIn ✅ PATCHED  
- [ ] **1.3** RLS on GymClass ✅ PATCHED
- [ ] **1.4** RLS on Coach ✅ PATCHED
- [ ] **1.5** Verify `deleteGym` checks gym ownership
  ```javascript
  // MUST HAVE:
  const gym = await base44.asServiceRole.entities.Gym.filter({ id: gymId })[0];
  if (gym.owner_email !== user.email && gym.admin_id !== user.id && user.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  ```

- [ ] **1.6** Verify `deleteMember` (manageMember) cannot ban gym owner
  ```javascript
  // MUST REJECT:
  const gym = await base44.asServiceRole.entities.Gym.filter({ id: gymId })[0];
  if (userId === gym.admin_id || userId === gym.owner_email) {
    return Response.json({ error: 'Cannot ban gym owner' }, { status: 403 });
  }
  ```

- [ ] **1.7** Verify `updateGym` checks ownership
  ```javascript
  const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });
  ```

- [ ] **1.8** Rate limit `sendPushNotification` per user (now 500/hour, 2000/day)
  - Currently: ✅ ENFORCED

- [ ] **1.9** Sanitize all message inputs (strip HTML tags)
  - Currently: ✅ `message.replace(/<[^>]*>/g, '')` 

- [ ] **1.10** Verify no API keys exposed in frontend code
  ```bash
  grep -r "STRIPE_SECRET" src/
  grep -r "api_key" src/
  grep -r "Authorization:" src/ | grep -v "Bearer"
  ```

---

### TIER 2: HIGH (MUST FIX, IMPACTS DATA ISOLATION)
- [ ] **2.1** Add RLS to Message entity (currently missing):
  ```json
  "rls": {
    "read": {
      "$or": [
        { "data.sender_id": "{{user.id}}" },
        { "data.receiver_id": "{{user.id}}" }
      ]
    },
    "create": {
      "data.sender_id": "{{user.id}}"
    },
    "update": {
      "$or": [
        { "data.sender_id": "{{user.id}}" },
        { "data.receiver_id": "{{user.id}}" }
      ]
    },
    "delete": {
      "$or": [
        { "data.sender_id": "{{user.id}}" },
        { "data.receiver_id": "{{user.id}}" }
      ]
    }
  }
  ```

- [ ] **2.2** Add RLS to Post entity (currently missing):
  ```json
  "rls": {
    "read": {
      "$or": [
        { "data.member_id": "{{user.id}}" },
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" } }
      ]
    },
    "create": { "data.member_id": "{{user.id}}" },
    "update": {
      "$or": [
        { "data.member_id": "{{user.id}}" },
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" }, "user_condition": { "account_type": "gym_owner" } }
      ]
    },
    "delete": {
      "$or": [
        { "data.member_id": "{{user.id}}" },
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" }, "user_condition": { "account_type": "gym_owner" } }
      ]
    }
  }
  ```

- [ ] **2.3** Add RLS to Reward entity (currently missing):
  ```json
  "rls": {
    "read": {
      "$or": [
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "create": {
      "$or": [
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" }, "user_condition": { "account_type": "gym_owner" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": {
      "$or": [
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" }, "user_condition": { "account_type": "gym_owner" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": {
      "$or": [
        { "data.gym_id": { "$in": "{{user.gymMemberships}}" }, "user_condition": { "account_type": "gym_owner" } },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
  ```

- [ ] **2.4** Add RLS to Notification entity (currently missing):
  ```json
  "rls": {
    "read": {
      "$or": [
        { "data.user_id": "{{user.id}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "create": { "user_condition": { "role": "admin" } },
    "update": {
      "$or": [
        { "data.user_id": "{{user.id}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": {
      "$or": [
        { "data.user_id": "{{user.id}}" },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
  ```

- [ ] **2.5** Add input validation to all text fields (max lengths, sanitization):
  - Messages: max 500 chars ✅
  - Post content: max 2000 chars ✅
  - Reward title: ADD LIMIT
  - Event title: ADD LIMIT
  - Challenge title: ADD LIMIT

- [ ] **2.6** Verify all file uploads (image_url, avatar_url, video_url) validate HTTPS origin:
  ```javascript
  function isValidUrl(url) {
    if (!url) return true;
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && /\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(u.pathname);
    } catch {
      return false;
    }
  }
  ```

- [ ] **2.7** Verify no user-supplied data in emails/notifications without sanitization:
  - Check: `sendPushNotification` sanitizes ✅
  - Check: `createNotification` sanitizes ✅
  - Check: Notification templates don't use raw user input

---

### TIER 3: MEDIUM (IMPACTS AUDIT/MONITORING)
- [ ] **3.1** Add audit logging for sensitive actions:
  ```javascript
  // Log these events with timestamp + user + action:
  // - Gym creation
  // - Gym deletion
  // - Member ban/unban
  // - Reward claim
  // - Payment processing
  // - Role changes
  ```

- [ ] **3.2** Add logging for authorization failures:
  ```javascript
  console.warn(`SECURITY: User ${user.id} attempted unauthorized action`, {
    action: 'deleteGym',
    targetGymId: gymId,
    userEmail: user.email,
    timestamp: new Date().toISOString()
  });
  ```

- [ ] **3.3** Monitor for rapid reward claims (fraud detection):
  ```javascript
  // Check if user claimed >5 rewards in 1 hour
  const recentClaims = await base44.asServiceRole.entities.ClaimedBonus.filter({
    user_id: user.id,
    created_date: { $gte: oneHourAgo }
  });
  if (recentClaims.length > 5) {
    console.warn(`Fraud alert: User ${user.id} claimed ${recentClaims.length} rewards in 1 hour`);
  }
  ```

- [ ] **3.4** Implement CORS restriction (if deployed behind reverse proxy):
  ```javascript
  // In backend functions or nginx config:
  // Allow ONLY: https://your-app-domain.com
  // Block: Cross-origin requests from other domains
  ```

- [ ] **3.5** Implement request signing for sensitive API endpoints:
  - Add timestamp verification (prevent replay)
  - Add request hash verification (prevent tampering)

---

### TIER 4: LOW (BEST PRACTICES)
- [ ] **4.1** Implement brute-force protection on check-in:
  - Currently: 3 check-ins per 24h ✅
  - Add: IP-based rate limiting?

- [ ] **4.2** Add timezone validation to date fields:
  ```javascript
  // Don't assume browser timezone - store explicit user timezone
  const userTimezone = user.timezone || 'Europe/London';
  ```

- [ ] **4.3** XSS protection in user input:
  - Using react automatically escapes output ✅
  - Verify no dangerouslySetInnerHTML usage

- [ ] **4.4** SQL Injection prevention:
  - Using Base44 SDK (parameterized) ✅
  - No raw SQL queries ✅

---

## DEPLOYMENT CHECKLIST

### Before Publishing to Production:
- [ ] All entity RLS policies reviewed and tested
- [ ] All backend functions verified for authentication
- [ ] No API keys/secrets hardcoded in frontend
- [ ] HTTPS enforced (via platform)
- [ ] CORS configured (if needed)
- [ ] Rate limits tested
- [ ] Input sanitization verified
- [ ] Audit logging enabled
- [ ] Admin approval for production launch

### Configuration Verification:
```bash
# Verify no secrets exposed:
grep -r "STRIPE_SECRET" . --exclude-dir=node_modules
grep -r "Bearer" src/ # Verify only in backend functions

# Verify environment variables set:
echo $STRIPE_PUBLISHABLE_KEY # Frontend - OK to expose
echo $STRIPE_SECRET_KEY # Backend ONLY
```

### Post-Deployment Monitoring:
- [ ] Monitor error logs for auth failures
- [ ] Monitor for unusual check-in patterns
- [ ] Monitor for rapid reward claims
- [ ] Monitor for failed login attempts
- [ ] Set up alerts for >5% error rate

---

## SECURITY DECISIONS MADE

### 1. RLS Strategy
- **Multi-layer approach:** User > Owner > Admin
- **Prevents:** Horizontal privilege escalation (users accessing other users' data)
- **Prevents:** Vertical privilege escalation (users accessing admin data)

### 2. Rate Limiting
- **Check-in:** 1 per day per gym (duplicate prevention)
- **Push notifications:** 500/hour, 2000/day (spam prevention)
- **Reward claims:** 1 per reward (duplicate prevention)
- **Rationale:** Prevent fraud, DoS, spam

### 3. Input Validation
- **Message length:** 500 chars (prevent large payloads)
- **File URLs:** HTTPS only (prevent mixed content)
- **HTML stripping:** Remove `<` and `>` (prevent XSS)
- **Numeric validation:** Check `isFinite()` (prevent NaN injection)

### 4. Authentication Flow
- **Every API endpoint** calls `base44.auth.me()`
- **Every action** verifies gym ownership or admin role
- **Error messages** don't reveal internal details
- **Timestamps** logged for audit trail

---

## REFERENCES & STANDARDS
- OWASP Top 10 2021
- CWE-639: Authorization Bypass Through User-Controlled Key
- CWE-639: Missing Data Validation
- CWE-16: Configuration Management Vulnerabilities