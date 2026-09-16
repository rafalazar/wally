"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { z } from "zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfig } from "@/lib/supabase/config";
import { Icon } from "./icon";

export type Identity = { client: SupabaseClient<Database>; user: User; signOut: () => Promise<void> };

export function AuthBoundary({ children }: { children: (identity: Identity | null) => ReactNode }) {
  const [client] = useState(() => supabaseConfig() ? createClient() : null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!client);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!client) return;
    let active = true;
    let changed = false;
    void client.auth.getUser().then(({ data, error }) => {
      if (!active || changed) return;
      setUser(data.user);
      if (error && error.name !== "AuthSessionMissingError") setError("No pudimos verificar tu sesión. Revisa tu conexión y vuelve a intentarlo.");
      if (new URLSearchParams(window.location.search).has("auth_error")) {
        setError("No se completó el inicio de sesión con Google. Inténtalo otra vez.");
        window.history.replaceState({}, "", "/");
      }
      setLoading(false);
    }).catch(() => { if (active) { setError("No pudimos conectar con Supabase."); setLoading(false); } });
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      changed = true;
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_OUT") toast.dismiss();
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client]);

  async function signIn() {
    if (!client) return;
    setBusy(true); setError("");
    try {
      const config = supabaseConfig()!;
      const response = await fetch(`${config.url}/auth/v1/settings`, {
        headers: { apikey: config.key }, signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("No se pudo verificar el proveedor.");
      const settings = z.object({ external: z.object({ google: z.boolean().optional() }) }).parse(await response.json());
      if (!settings.external.google) {
        setError("El inicio de sesión con Google aún está en configuración. Puedes explorar la demo mientras tanto.");
        setBusy(false); return;
      }
      const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    } catch {
      setError("No pudimos iniciar sesión con Google. Verifica la conexión y que Google esté habilitado en Supabase.");
      setBusy(false);
    }
  }
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw new Error("No se pudo cerrar la sesión. Revisa tu conexión e inténtalo otra vez.");
    toast.dismiss(); setUser(null);
  }

  if (!client) return <><div className="connection-notice" role="status">Modo local · La sincronización con Supabase aún no está configurada.</div>{children(null)}</>;
  if (loading) return <main className="auth-page"><div className="view-loading" role="status"><Icon name="loader" className="spin" />Verificando tu sesión...</div></main>;
  if (user) return children({ client, user, signOut });
  return <main className="auth-page"><section className="auth-card" aria-labelledby="login-title">
    <span className="brand-mark"><Icon name="wallet" size={32} /></span>
    <span className="section-kicker">BIENVENIDO A WALLY</span>
    <h1 id="login-title">Tus cuentas, contigo.</h1>
    <p>Registra tus ingresos y gastos en soles. Organiza tu billetera personal y comparte otra con quienes tú elijas.</p>
    <button className="primary-button full-width" onClick={() => void signIn()} disabled={busy}>
      <Icon name={busy ? "loader" : "arrow"} className={busy ? "spin" : undefined} size={20} />
      {busy ? "Conectando con Google..." : "Continuar con Google"}
    </button>
    <Link className="text-button" href="/demo">Explorar la demo en este navegador</Link>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <p className="small-print">Tu billetera personal es privada. Solo los miembros de una billetera compartida pueden ver y editar sus movimientos.</p>
  </section></main>;
}
