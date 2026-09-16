import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";
import type { Database } from "./database.types";

export async function createClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Falta configurar la conexión de Supabase.");
  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        // Server Components cannot write cookies. Proxy handles their refresh.
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Read-only Server Component context. */ }
      },
    },
  });
}
