export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  if (!key.startsWith("sb_publishable_")) throw new Error("Configura la clave publicable de Supabase (sb_publishable_...).");
  return { url, key };
}
