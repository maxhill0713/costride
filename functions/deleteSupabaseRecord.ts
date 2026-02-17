import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    
    // Handle automation payload (from entity delete events)
    let table = body.table;
    let id = body.id;
    
    if (body.event?.type === 'delete') {
      // Map entity name to table name (snake_case pluralized)
      const entityToTable = {
        'CheckIn': 'check_ins',
        'Achievement': 'achievements',
        'Challenge': 'challenges',
        'Post': 'posts',
        'Goal': 'goals',
        'Gym': 'gyms',
        'GymMember': 'gym_members',
        'GymMembership': 'gym_memberships',
        'Lift': 'lifts',
        'Event': 'events',
        'Reward': 'rewards',
        'Coach': 'coaches',
        'GymClass': 'gym_classes',
        'Message': 'messages',
        'Notification': 'notifications',
        'ChallengeParticipant': 'challenge_participants',
        'BrandDiscountCode': 'brand_discount_codes'
      };
      
      table = entityToTable[body.event.entity_name];
      id = body.event.entity_id;
    }

    if (!table || !id) {
      console.error('Missing parameters - Table:', table, 'ID:', id, 'Full body:', JSON.stringify(body));
      return Response.json({ 
        error: 'Table and ID required',
        received: { table, id, body }
      }, { status: 400 });
    }

    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/${table}?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete record');
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete record error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});