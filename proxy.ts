import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const config = supabaseConfig();
  if (!config) return NextResponse.next({ request });
  const response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  // Database RLS remains authoritative; there are no server data queries here.
  await supabase.auth.getClaims();
  // Forward the refreshed request cookies while preserving all response cookies.
  const forwarded = NextResponse.next({ request });
  response.cookies.getAll().forEach(cookie => forwarded.cookies.set(cookie));
  forwarded.headers.set("Cache-Control", "private, no-store, max-age=0");
  forwarded.headers.set("Pragma", "no-cache");
  forwarded.headers.set("Expires", "0");
  return forwarded;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf)$).*)"],
};
