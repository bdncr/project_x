import { createClient } from "@supabase/supabase-js";

/**
 * The browser client is deliberately nullable: the visual demo works without
 * credentials, while production calls can use this single configured client.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
