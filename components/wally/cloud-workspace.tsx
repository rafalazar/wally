"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { cloudWalletSchema, createWalletRepository, databaseError, type CloudWallet } from "@/lib/supabase/wallet-repository";
import type { Identity } from "./auth-boundary";
import { WallyProvider } from "./wally-provider";
import { Icon } from "./icon";
import { Modal } from "./modal";
import { Onboarding, OnboardingSuccess } from "./onboarding";

const onboardingProfileSchema = z.object({
  onboarding_completed_at: z.string().nullable(), initial_transaction_id: z.uuid().nullable(),
});

const memberSchema = z.object({ user_id: z.uuid(), display_name: z.string(), role: z.enum(["owner", "member"]) });
type Member = z.infer<typeof memberSchema>;

function SharingPanel({ identity, wallet, onChanged, onClose }: {
  identity: Identity; wallet: CloudWallet; onChanged: (id?: string) => Promise<void>; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [invitation, setInvitation] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const owner = wallet.owner_id === identity.user.id;
  const loadMembers = useCallback(async () => {
    const { data, error } = await identity.client.rpc("list_wallet_members", { p_wallet_id: wallet.id });
    if (error) throw databaseError(error);
    setMembers(z.array(memberSchema).parse(data));
  }, [identity.client, wallet.id]);
  useEffect(() => {
    let active = true;
    void identity.client.rpc("list_wallet_members", { p_wallet_id: wallet.id }).then(({ data, error }) => {
      if (!active) return;
      if (error) setError(databaseError(error).message);
      else setMembers(z.array(memberSchema).parse(data));
    });
    return () => { active = false; };
  }, [identity.client, wallet.id]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos completar la operación."); }
    finally { setBusy(false); }
  }
  return <div className="sharing-panel">
    <p className="modal-intro">Tu billetera personal es privada. En las compartidas, todos los miembros pueden registrar, editar y eliminar movimientos.</p>
    <form onSubmit={event => { event.preventDefault(); void run(async () => {
      const { data, error } = await identity.client.rpc("create_shared_wallet", { p_name: name.trim() });
      if (error) throw databaseError(error);
      await onChanged(z.uuid().parse(data)); onClose();
    }); }}>
      <label htmlFor="new-wallet-name">Crear una billetera compartida</label>
      <div className="inline-fields"><input id="new-wallet-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} required placeholder="Ej. Gastos de casa" />
        <button className="secondary-button" disabled={busy || !name.trim()}>Crear</button></div>
    </form>
    <form onSubmit={event => { event.preventDefault(); void run(async () => {
      const { data, error } = await identity.client.rpc("accept_wallet_invitation", { p_token: joinCode.trim() });
      if (error) throw databaseError(error);
      await onChanged(z.uuid().parse(data)); onClose();
    }); }}>
      <label htmlFor="join-wallet-code">Unirme con un código de invitación</label>
      <div className="inline-fields"><input id="join-wallet-code" value={joinCode} onChange={e => setJoinCode(e.target.value)} maxLength={64} required autoComplete="off" placeholder="Pega el código que te compartieron" />
        <button className="secondary-button" disabled={busy || !joinCode.trim()}>Unirme</button></div>
    </form>
    {wallet.kind === "shared" && <section className="wallet-members"><h3>Miembros de {wallet.name}</h3>
      {members.map(member => <div className="member-row" key={member.user_id}>
        <span>{member.display_name}<small>{member.role === "owner" ? "Propietario" : "Puede editar todos los movimientos"}</small></span>
        {owner && member.role !== "owner" && <button className="text-button" disabled={busy} onClick={() => void run(async () => {
          const { error } = await identity.client.from("wallet_members").delete().eq("wallet_id", wallet.id).eq("user_id", member.user_id);
          if (error) throw databaseError(error);
          await loadMembers(); setNotice("Miembro retirado. Sus movimientos se conservan.");
        })}>Retirar</button>}
      </div>)}
      {owner && <>
        <button className="secondary-button full-width" disabled={busy} onClick={() => void run(async () => {
          const { data, error } = await identity.client.rpc("create_wallet_invitation", { p_wallet_id: wallet.id });
          if (error) throw databaseError(error);
          setInvitation(z.string().parse(data));
        })}>Crear código de invitación</button>
        {invitation && <div className="invitation-result"><label htmlFor="created-code">Código de un solo uso · válido durante 7 días</label>
          <input id="created-code" readOnly value={invitation} onFocus={event => event.target.select()} />
          <button className="text-button" onClick={() => void run(async () => { await navigator.clipboard.writeText(invitation); setNotice("Código copiado. Compártelo con la persona que quieres invitar."); })}>Copiar código</button>
        </div>}
        <button className="text-button" disabled={busy} onClick={() => void run(async () => {
          const { error } = await identity.client.from("wallet_invitations").delete().eq("wallet_id", wallet.id).is("accepted_at", null);
          if (error) throw databaseError(error);
          setInvitation(""); setNotice("Invitaciones pendientes anuladas.");
        })}>Anular invitaciones pendientes</button>
      </>}
    </section>}
    {notice && <p role="status">{notice}</p>}
    {error && <div className="inline-error" role="alert">{error}</div>}
  </div>;
}

function ActiveWallet({ identity, wallet, children }: { identity: Identity; wallet: CloudWallet; children: ReactNode }) {
  const repository = useMemo(() => createWalletRepository(identity.client, wallet.id), [identity.client, wallet.id]);
  const name = identity.user.user_metadata.full_name || identity.user.email || "Mi cuenta";
  return <WallyProvider repository={repository} scope={`${identity.user.id}:${wallet.id}`} displayName={name} signOut={identity.signOut}>{children}</WallyProvider>;
}

export function CloudWorkspace({ identity, children }: { identity: Identity; children: ReactNode }) {
  const [wallets, setWallets] = useState<CloudWallet[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [profile, setProfile] = useState<z.infer<typeof onboardingProfileSchema>>();
  const [welcomeTransactionId, setWelcomeTransactionId] = useState<string | null>(null);
  const loadRevision = useRef(0);
  const completing = useRef(false);
  const invalidateLoad = useCallback(() => { loadRevision.current++; }, []);
  const load = useCallback(async (id?: string) => {
    const revision = ++loadRevision.current;
    const [walletResult, profileResult] = await Promise.all([
      identity.client.from("wallets").select("id,name,kind,currency_code,owner_id").order("created_at"),
      identity.client.from("profiles").select("onboarding_completed_at,initial_transaction_id").eq("id", identity.user.id).single(),
    ]);
    if (walletResult.error) throw databaseError(walletResult.error);
    if (profileResult.error) throw databaseError(profileResult.error);
    const items = z.array(cloudWalletSchema).parse(walletResult.data);
    const nextProfile = onboardingProfileSchema.parse(profileResult.data);
    if (revision !== loadRevision.current) return;
    setWallets(items); setProfile(nextProfile); setError(""); setLoaded(true);
    if (id) setSelectedId(id);
  }, [identity.client, identity.user.id]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!completing.current) void load().catch(cause => { if (active) { setError(cause.message); setLoaded(true); } });
    };
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; invalidateLoad(); window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [load, invalidateLoad]);
  const selected = wallets.find(w => w.id === selectedId) ?? wallets.find(w => w.kind === "personal") ?? wallets[0];
  if (!selected || !profile) return <main className="auth-page"><section className="auth-card">
    <h1>{loaded ? "Preparemos tu billetera" : "Cargando tus billeteras..."}</h1>
    {error && <div className="inline-error" role="alert">{error}</div>}
    {loaded && !error && <p>No encontramos tu billetera personal. Revisa que la migración de Wally esté aplicada.</p>}
    <button className="secondary-button" onClick={() => void load().catch(cause => setError(cause.message))}>Reintentar</button>
    <button className="text-button" onClick={() => void identity.signOut().catch(cause => setError(cause.message))}>Cerrar sesión</button>
  </section></main>;
  if (profile.onboarding_completed_at === null) return <Onboarding signOut={identity.signOut} connectionError={error}
    onComplete={async amountCents => {
      completing.current = true;
      loadRevision.current++;
      try {
        const { data, error } = await identity.client.rpc("complete_onboarding", { p_amount_cents: amountCents });
        if (error) throw databaseError(error);
        const result = onboardingProfileSchema.extend({ wallet_id: z.uuid(), onboarding_completed_at: z.string() }).parse(data);
        await load(result.wallet_id);
        setWelcomeTransactionId(result.initial_transaction_id);
      } finally { completing.current = false; }
    }} />;
  return <>
    <div className="workspace-bar"><div>
      <label htmlFor="wallet-selector"><Icon name="wallet" size={17} />Billetera</label>
      <select id="wallet-selector" value={selected.id} onChange={e => { setSelectedId(e.target.value); setSharing(false); }}>
        {wallets.map(wallet => <option key={wallet.id} value={wallet.id}>{wallet.name} · {wallet.kind === "personal" ? "Privada" : "Compartida"}</option>)}
      </select><span className="currency-badge">PEN</span>
      <button className="text-button" onClick={() => setSharing(true)}>Gestionar billeteras</button>
    </div></div>
    {error && <p className="connection-notice" role="alert">{error}</p>}
    <ActiveWallet key={`${identity.user.id}:${selected.id}`} identity={identity} wallet={selected}>
      {welcomeTransactionId && <OnboardingSuccess transactionId={welcomeTransactionId} />}
      {children}
    </ActiveWallet>
    {sharing && <Modal title="Tus billeteras" onClose={() => setSharing(false)}>
      <SharingPanel key={selected.id} identity={identity} wallet={selected} onChanged={load} onClose={() => setSharing(false)} />
    </Modal>}
  </>;
}
