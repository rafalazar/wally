"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { createStore, useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { categories, categorySchema, localDate, paymentSchema, type CategoryId, type PaymentMethod, type TransactionType } from "@/lib/finance";
import { defaultFilters, type HistoryFilters } from "@/lib/insights";
import type { WalletCommand, WalletRepository } from "@/lib/wallet-store";

export type View = "register" | "history" | "insights";
type Choice = { category: CategoryId; paymentMethod: PaymentMethod };
type Preferences = Record<TransactionType, Choice>;
type UiState = {
  view: View;
  filters: HistoryFilters;
  month: string;
  preferences: Preferences;
  navigate: (view: View) => void;
  setFilters: (filters: Partial<HistoryFilters>) => void;
  clearFilters: () => void;
  setMonth: (month: string) => void;
  remember: (type: TransactionType, choice: Choice) => void;
};

const choiceSchema = z.object({ category: categorySchema, paymentMethod: paymentSchema });
const preferencesSchema = z.object({
  expense: choiceSchema,
  income: choiceSchema.refine(c => ["cash", "transfer"].includes(c.paymentMethod)),
});
const storage = {
  getItem: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  setItem: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Preferences may stay in memory when browser storage is unavailable. */ } },
  removeItem: (key: string) => { try { localStorage.removeItem(key); } catch { /* Optional preferences do not block the wallet. */ } },
};

function createUiStore(scope: string) {
  return createStore<UiState>()(persist((set) => ({
    view: "register",
    filters: { ...defaultFilters },
    month: localDate().slice(0, 7),
    preferences: {
      expense: { category: "food", paymentMethod: "debit" },
      income: { category: "salary", paymentMethod: "transfer" },
    },
    navigate: view => set({ view }),
    setFilters: filters => set(state => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({ filters: { ...defaultFilters } }),
    setMonth: month => set({ month }),
    remember: (type, choice) => set(state => ({ preferences: { ...state.preferences, [type]: choice } })),
  }), {
    name: `wally.preferences.pen.${scope}`,
    storage: createJSONStorage(() => storage),
    skipHydration: true,
    partialize: state => ({ preferences: state.preferences }),
    merge: (persisted, current) => {
      const result = z.object({ preferences: preferencesSchema }).safeParse(persisted);
      return result.success ? { ...current, preferences: result.data.preferences } : current;
    },
  }));
}

const UiContext = createContext<ReturnType<typeof createUiStore> | null>(null);
export function useUi<T>(selector: (state: UiState) => T): T {
  const store = useContext(UiContext);
  if (!store) throw new Error("WallyProvider is required.");
  return useStore(store, selector);
}

const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

type Workspace = { repository: WalletRepository; scope: string; displayName: string; storageMode?: "cloud" | "local"; signOut: () => Promise<void> };
const WorkspaceContext = createContext<Workspace | null>(null);
export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("WallyProvider is required.");
  return workspace;
}

export function WallyProvider({ children, repository, scope, displayName, storageMode = "cloud", signOut }: Workspace & { children: ReactNode }) {
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uiStore] = useState(() => createUiStore(scope));
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: false, networkMode: "always", staleTime: 15000 },
      mutations: { retry: false, networkMode: "always" },
    },
  }));
  useEffect(() => { void uiStore.persist.rehydrate(); }, [uiStore]);
  useEffect(() => {
    if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
    // Strict Mode repeats effect setup/cleanup without unmounting the provider.
    // Clear only after a real unmount, when no replacement setup cancels this timer.
    return () => { cleanupTimer.current = setTimeout(() => queryClient.clear(), 0); };
  }, [queryClient]);
  return <WorkspaceContext.Provider value={{ repository, scope, displayName, storageMode, signOut }}><UiContext.Provider value={uiStore}>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: "easeOut" }}>
        {children}
        <Toaster position="bottom-right" richColors closeButton duration={6500} containerAriaLabel="Notificaciones"
          toastOptions={{ className: "wally-notification" }} />
      </MotionConfig>
    </QueryClientProvider>
  </UiContext.Provider></WorkspaceContext.Provider>;
}

export function useWallet() {
  const { repository, scope } = useWorkspace();
  const walletKey = ["wallet", scope];
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  const client = useQueryClient();
  const query = useQuery({ queryKey: walletKey, queryFn: () => repository.load(), enabled: hydrated, refetchInterval: 30000 });
  const mutation = useMutation({
    mutationFn: (command: WalletCommand) => repository.execute(command),
    scope: { id: scope },
    onMutate: async () => { await client.cancelQueries({ queryKey: walletKey }); },
    onSuccess: result => { client.setQueryData(walletKey, result.data); },
    onError: () => { void client.invalidateQueries({ queryKey: walletKey }); },
  });
  return { ...query, execute: mutation.mutateAsync, saving: mutation.isPending };
}

export function useCategories() { return useWallet().data?.categories ?? categories; }

