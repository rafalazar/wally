"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { formatMoney, parseAmount } from "@/lib/finance";
import { AmountInput } from "./amount-input";
import { Icon } from "./icon";
import { useWallet } from "./wally-provider";

export function Onboarding({ onComplete, signOut, connectionError }: {
  onComplete: (amountCents: number) => Promise<void>;
  signOut: () => Promise<void>;
  connectionError?: string;
}) {
  const id = useId();
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const submitting = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || leaving) return;
    const cents = parseAmount(amount);
    if (cents === null) {
      setAmountError("Ingresa un monto mayor a 0, con hasta 2 decimales.");
      input.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true); setAmountError(""); setError("");
    try { await onComplete(cents); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos guardar tu saldo inicial. Inténtalo otra vez."); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <div className="onboarding-page">
    <header className="onboarding-header">
      <span className="brand"><span className="brand-mark"><Icon name="wallet" size={25} /></span><span className="brand-name">Wally</span></span>
      <button className="text-button onboarding-signout" disabled={busy || leaving} onClick={async () => {
        setLeaving(true); setError("");
        try { await signOut(); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos cerrar tu sesión. Inténtalo otra vez."); }
        finally { setLeaving(false); }
      }}>{leaving ? "Cerrando sesión..." : "Cerrar sesión"}</button>
    </header>
    <main className="onboarding-layout" aria-labelledby={`${id}-title`}>
      <div className="onboarding-intro">
        <h1 ref={heading} tabIndex={-1} id={`${id}-title`}>¿Con cuánto <span>empezamos?</span></h1>
        <p>Ingresa el dinero disponible con el que quieres empezar a llevar tus cuentas.</p>
        <p className="onboarding-private"><Icon name="shield" size={18} />Tu billetera personal, solo para ti.</p>
      </div>
      <form className="onboarding-form" noValidate onSubmit={submit} aria-busy={busy}>
        <label htmlFor={`${id}-amount`}>Tu saldo inicial</label>
        <span className="onboarding-currency">Soles peruanos · PEN</span>
        <div className={`onboarding-amount ${amountError ? "has-error" : ""}`}>
          <span aria-hidden="true">S/</span>
          <AmountInput ref={input} id={`${id}-amount`} value={amount} onValueChange={value => {
            setAmount(value); if (amountError) setAmountError("");
          }} disabled={busy || leaving} placeholder="0.00" className={amount.length > 7 ? "long-amount" : ""}
            aria-invalid={!!amountError} aria-describedby={`${id}-hint${amountError ? ` ${id}-error` : ""}`} />
        </div>
        {amountError && <p className="field-error" role="alert" id={`${id}-error`}>{amountError}</p>}
        <p className="onboarding-hint" id={`${id}-hint`}>Lo registraremos como tu primer ingreso. Puedes corregirlo después.</p>
        {(error || connectionError) && <p className="inline-error" role="alert">{error || connectionError}</p>}
        <button className="onboarding-submit" type="submit" disabled={busy || leaving}>
          <span>{busy ? "Guardando tu saldo..." : "Empezar con este monto"}</span>
          <Icon name={busy ? "loader" : "arrow"} size={20} className={busy ? "spin" : undefined} />
        </button>
        <p className="onboarding-footnote">Un primer paso para tener tus cuentas claras.</p>
      </form>
    </main>
  </div>;
}

export function OnboardingSuccess({ transactionId }: { transactionId: string }) {
  const wallet = useWallet();
  const transaction = wallet.data?.transactions.find(item => item.id === transactionId);
  const confirmation = useRef<HTMLDivElement>(null);
  const announced = useRef(false);
  const ready = !!transaction && !wallet.isError;
  useEffect(() => {
    if (ready && !announced.current) {
      announced.current = true;
      confirmation.current?.focus({ preventScroll: true });
    }
  }, [ready]);
  if (!ready) return null;
  return <div ref={confirmation} tabIndex={-1} className="onboarding-success" role="status">
    <Icon name="check" size={20} /><span>Tu saldo inicial está listo: <strong>{formatMoney(transaction.amountCents)}</strong>.</span>
  </div>;
}
