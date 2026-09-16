import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const config = supabaseConfig();
  const code = request.nextUrl.searchParams.get("code");
  // A fixed same-origin destination avoids open redirect parameters.
  const response = NextResponse.redirect(new URL("/", request.url));
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  if (config && code) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }
  response.headers.set("Location", new URL("/?auth_error=callback", request.url).toString());
  return response;
}
