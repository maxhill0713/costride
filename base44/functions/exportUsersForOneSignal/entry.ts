import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Exports all app users as a CSV file formatted for OneSignal's
 * "CSV Upload" feature (Users > Import Users > CSV).
 *
 * OneSignal CSV format requires a header row with at minimum:
 *   external_id  — your internal user ID
 *
 * Optional columns that OneSignal accepts:
 *   email, phone, first_name, last_name, language, country, timezone
 *
 * Usage: call this function from the frontend, then download the returned CSV.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Only admins can export user data
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users (service role so we can see everyone)
    const users = await base44.asServiceRole.entities.User.list('-created_date', 5000);

    if (!users || users.length === 0) {
      return new Response('No users found', { status: 404 });
    }

    // Build CSV rows
    const header = ['external_id', 'email', 'first_name', 'last_name'];
    const rows = users.map(u => {
      const nameParts = (u.full_name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName  = nameParts.slice(1).join(' ') || '';

      return [
        csvEscape(u.id       || ''),
        csvEscape(u.email    || ''),
        csvEscape(firstName),
        csvEscape(lastName),
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');

    console.log(`Exported ${users.length} users for OneSignal`);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="onesignal_users.csv"',
      },
    });
  } catch (error) {
    console.error('exportUsersForOneSignal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function csvEscape(value) {
  const str = String(value);
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}