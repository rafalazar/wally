"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  createLocalTestWallet,
  LOCAL_TEST_SCOPE,
  LOCAL_TEST_USER,
  LOCAL_TEST_WALLET_KEY,
  type LocalTestState,
} from "@/lib/local-test-wallet";
import { localTestSessionSnapshot } from "@/lib/local-test-access";
import { Onboarding, OnboardingSuccess } from "./onboarding";
import { WallyProvider } from "./wally-provider";

export default function LocalWorkspace({
  children,
  signOut,
}: {
  children: ReactNode;
  signOut: () => Promise<void>;
}) {
  const [store] = useState(() =>
    createLocalTestWallet({
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    }),
  );
  const read = () => {
    try {
      return { data: store.read(), error: "" };
    } catch (cause) {
      return { data: null, error: (cause as Error).message };
    }
  };
  const [state, setState] = useState<{
    data: LocalTestState | null;
    error: string;
  }>(read);
  const [welcomeId, setWelcomeId] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key !== LOCAL_TEST_WALLET_KEY && event.key !== null) return;
      try {
        setState({ data: store.read(), error: "" });
      } catch (cause) {
        setState({ data: null, error: (cause as Error).message });
      }
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [store]);
  function reset() {
    try {
      const data = store.reset();
      localStorage.removeItem(`wally.preferences.pen.${LOCAL_TEST_SCOPE}`);
      toast.dismiss();
      setWelcomeId(null);
      setRun((value) => value + 1);
      setState({ data, error: "" });
    } catch (cause) {
      setState((previous) => ({
        ...previous,
        error: (cause as Error).message,
      }));
    }
  }
  if (localTestSessionSnapshot() !== 2) return null;
  return (
    <>
      <aside className="local-test-bar" aria-label="Sesión de prueba local">
        <div>
          <strong>{LOCAL_TEST_USER.name}</strong>
          <span>Solo en este navegador · Datos de prueba</span>
        </div>
        <button className="text-button" onClick={reset}>
          Reiniciar prueba
        </button>
        {state.data?.completedAt && (
          <button
            className="text-button"
            onClick={() =>
              void signOut().catch((cause) =>
                setState((previous) => ({ ...previous, error: cause.message })),
              )
            }
          >
            Cerrar sesión
          </button>
        )}
      </aside>
      {state.error && (
        <p className="connection-notice" role="alert">
          {state.error}
        </p>
      )}
      {!state.data ? (
        <main className="auth-page">
          <section className="auth-card">
            <h1>Recuperemos tu prueba</h1>
            <button
              className="secondary-button"
              onClick={() => setState(read())}
            >
              Reintentar
            </button>
            <button className="text-button" onClick={() => void signOut()}>
              Cerrar sesión
            </button>
          </section>
        </main>
      ) : !state.data.completedAt ? (
        <Onboarding
          key={run}
          signOut={signOut}
          onComplete={async (amount) => {
            const data = store.completeOnboarding(amount);
            setWelcomeId(data.initialId);
            setState({ data, error: "" });
          }}
        />
      ) : (
        <WallyProvider
          key={state.data.completedAt}
          repository={store.repository}
          scope={LOCAL_TEST_SCOPE}
          displayName={LOCAL_TEST_USER.name}
          storageMode="local"
          signOut={signOut}
        >
          {welcomeId && <OnboardingSuccess transactionId={welcomeId} />}
          {children}
        </WallyProvider>
      )}
    </>
  );
}
