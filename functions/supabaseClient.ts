import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  return Response.json({ 
    status: 'Supabase client initialized',
    url: supabaseUrl 
  });
});