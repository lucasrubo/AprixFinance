import { createClient } from "@supabase/supabase-js";

// biome-ignore lint/style/noNonNullAssertion: validado pela verificação abaixo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// biome-ignore lint/style/noNonNullAssertion: validado pela verificação abaixo
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for browser usage
export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Server client (for server components and API routes)
export const createServerSupabaseClient = () => {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  );
};
