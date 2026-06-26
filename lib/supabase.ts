import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During static build without env vars, return a dummy client that will fail at runtime
    // This prevents build-time crashes on pages that don't actually call Supabase statically
    if (process.env.NODE_ENV === 'production' && !supabaseUrl) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Set it in your Vercel project settings or .env.local file.'
      );
    }
    // Fallback for build-time static analysis
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
  }

  _client = createClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

// Proxy object that lazily initialises the real client on first use
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
