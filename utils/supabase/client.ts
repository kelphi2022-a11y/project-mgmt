// app/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

// Lazily create the browser client so module evaluation during build
// doesn't throw when env vars are not yet set.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

// Named export for backwards compat with existing imports of `supabase`
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    return (getSupabaseBrowserClient() as any)[prop];
  },
});
