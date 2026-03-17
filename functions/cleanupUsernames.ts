import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('full_name', 1000);
    let updated = 0;

    for (const u of allUsers) {
      if (!u.username) continue;
      if (!u.username.includes(' ')) continue;

      const cleanedUsername = u.username.replace(/\s+/g, '').toLowerCase();
      if (cleanedUsername === u.username) continue;

      // Check if cleaned username is already taken
      const existing = await base44.asServiceRole.entities.User.filter({ username: cleanedUsername });
      if (existing.length > 0 && existing[0].id !== u.id) {
        console.log(`Skipping ${u.username} -> ${cleanedUsername}: already taken`);
        continue;
      }

      await base44.asServiceRole.entities.User.update(u.id, { username: cleanedUsername });
      console.log(`Updated ${u.username} -> ${cleanedUsername}`);
      updated++;
    }

    return Response.json({ updated, message: `Cleaned ${updated} usernames` });
  } catch (error) {
    console.error('Error cleaning usernames:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});