import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    // biome-ignore lint/style/noNonNullAssertion: variável de ambiente obrigatória
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: variável de ambiente obrigatória
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
