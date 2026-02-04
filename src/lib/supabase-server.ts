/**
 * Server-only Supabase client using the service role key.
 * Use only from API routes or other server code. Never import in client components.
 * Bypasses RLS; API routes are responsible for access control.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function createServerSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/** Server-side Supabase client; null if SUPABASE_SERVICE_ROLE_KEY or URL not set. */
export const supabaseServer = createServerSupabase();
