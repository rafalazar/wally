"use client";

import { lazy, Suspense, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { localDate, recentFirst, restoredTransaction, summarize, formatMoney, type CategoryId, type Transaction } from "@/lib/finance";
import { defaultFilters } from "@/lib/insights";
import { downloadTransactions } from "@/lib/export";
import { type WalletCommand } from "@/lib/wallet-store";
import { Header } from "./header";
import { Icon } from "./icon";
import { HelpPanel, PrivacyPanel } from "./info-panels";
import { Metrics } from "./metrics";
import { Modal } from "./modal";
import { TransactionForm } from "./transaction-form";
import { EmptyState, History, TransactionDetail, TransactionRow } from "./transaction-history";
import { useCategories, useUi, useWallet, useWorkspace } from "./wally-provider";
import { localTestSessionSnapshot, localTestServerSnapshot, setLocalTestSession, subscribeLocalTestSession } from "@/lib/local-test-access";
import { AuthBoundary } from "./auth-boundary";
import { CloudWorkspace } from "./cloud-workspace";

const Insights = dynamic(() => import("./insights"), {
  ssr: false,
  loading: () => <div className="view-loading" role="status"><Icon name="loader" className="spin" />Preparando tu resumen...</div>,
});
type OpenModal = { kind: "help" | "privacy" } | { kind: "detail"; id: string };
const emptyTransactions: Transaction[] = [];
const LocalWorkspace = process.env.NODE_ENV === "development" ? lazy(() => import("./local-workspace")) : null;

function WalletScreen() {
  const { storageMode } = useWorkspace();
  const wallet = useWallet();
  const categories = useCategories();
  const transactions = wallet.isError ? emptyTransactions : wallet.data?.transactions ?? emptyTransactions;
  const ready = !!wallet.data && !wallet.isError;
  const canSave = ready && !wallet.isError;
  const totals = useMemo(() => summarize(transactions), [transactions]);
  const recent = useMemo(() => recentFirst(transactions).slice(0, 3), [transactions]);
  const view = useUi(state => state.view);
  const navigate = useUi(state => state.navigate);
  const setFilters = useUi(state => state.setFilters);
  const [modal, setModal] = useState<OpenModal | null>(null);
  const selected = modal?.kind === "detail" ? transactions.find(item => item.id === modal.id) : undefined;

  function notifyWithUndo(message: string, command: WalletCommand) {
    toast.success(message, {
      id: "wallet-change",
      description: "Tus cuentas están actualizadas.",
      action: {
        label: "Deshacer",
        onClick: () => {
          void wallet.execute(command).then(() => toast.success("Cambio deshecho.", { id: "wallet-change" }))
            .catch(error => toast.error(error instanceof Error ? error.message : "No se pudo deshacer el cambio."));
        },
      },
    });
  }
  async function save(transaction: Transaction) {
    const result = await wallet.execute({ type: "add", transaction });
    notifyWithUndo(`${transaction.type === "income" ? "Ingreso" : "Gasto"} de ${formatMoney(transaction.amountCents)} registrado`, { type: "remove", id: transaction.id, version: result.data.transactions.find(t => t.id === transaction.id)?.version });
  }
  async function update(transaction: Transaction) {
    const result = await wallet.execute({ type: "update", transaction });
    setModal(null);
    if (result.previous) notifyWithUndo("Movimiento actualizado.", { type: "update", transaction: result.previous });
  }
  async function remove(id: string) {
    const result = await wallet.execute({ type: "remove", id, version: transactions.find(t => t.id === id)?.version });
    setModal(null);
    if (result.previous) notifyWithUndo("Movimiento eliminado.", { type: "restore", transaction: restoredTransaction(result.previous) });
  }
  function exportTransactions(items = transactions) {
    if (!items.length) { toast.info("Registra un movimiento para exportar tus cuentas."); return; }
    downloadTransactions(items, categories);
    toast.success(`CSV preparado con ${items.length} ${items.length === 1 ? "movimiento" : "movimientos"}.`);
  }
  function create() {
    navigate("register");
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".quick-record [data-amount]")?.focus());
  }
  function viewCategory(category: CategoryId, month: string) {
    setFilters({ ...defaultFilters, category, month, type: "expense" });
    navigate("history");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function closeModal() { if (!wallet.saving) setModal(null); }
  const modalTitle = modal?.kind === "detail" ? "Tu movimiento" : modal?.kind === "help" ? "Tus cuentas, sin complicaciones" : "Tu información, bajo tu control";

  return <div className="wally-app">
    <a className="skip-link" href="#main">Ir al contenido</a>
    <Header balance={ready ? totals.balance : undefined} onHelp={() => setModal({ kind: "help" })}
      onPrivacy={() => setModal({ kind: "privacy" })} onExport={() => exportTransactions()} />
    <main className="main-content" id="main">
      <div className="overview-context">
        <p><Icon name="calendar" size={14} /><span>Tu espacio financiero</span><span className="context-divider">/</span>
          {ready ? new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(new Date(`${localDate()}T12:00:00`)) : "Bienvenido"}
        </p>
        <span className="sync-label"><span className="status-dot" />{ready ? storageMode === "local" ? "Guardado en este navegador" : "Guardado en tu cuenta" : "Preparando tu espacio"}</span>
      </div>
      {wallet.isError && <div className="storage-error" role="alert"><Icon name="info" />
        <span>{wallet.error.message}</span><button className="text-button" onClick={() => void wallet.refetch()} disabled={wallet.isFetching}>Reintentar</button>
      </div>}
      {view === "register" && <Metrics totals={totals} ready={ready} />}

      <motion.div hidden={view !== "register"} initial={false}
        animate={{ opacity: view === "register" ? 1 : 0, y: view === "register" ? 0 : 8 }}>
        {ready ? <TransactionForm ready={canSave} onSave={save} /> : <div className="record-skeleton" aria-busy="true" role="status">
          <span className="skeleton-line" /><span className="skeleton-line short" /><div className="skeleton-amount" />
          <span className="skeleton-line" /><span className="skeleton-line" />
          <p>{wallet.isError ? "Tu registro estará disponible al recuperar el acceso a tus datos." : "Preparando tu registro..."}</p>
        </div>}
        <section className="recent-section" aria-labelledby="recent-title">
          <div className="recent-heading">
            <div className="section-heading"><h2 id="recent-title">Últimos movimientos</h2><p>Los pequeños pasos que ponen todo en orden.</p></div>
            <button className="history-link" onClick={() => navigate("history")}>Ver todos<Icon name="arrow" size={16} /></button>
          </div>
          <div className="transactions-card" aria-busy={!ready}>
            {!ready ? <div className="loading-state">Tus movimientos aparecerán aquí.</div>
              : recent.length ? recent.map(item => <TransactionRow key={item.id} transaction={item} onClick={() => setModal({ kind: "detail", id: item.id })} />)
              : <EmptyState onAction={create} />}
          </div>
          {recent.length > 0 && <p className="recent-footnote"><Icon name="saved" size={14} />Todo al día. Cada movimiento cuenta.</p>}
        </section>
      </motion.div>

      <AnimatePresence mode="wait">
        {view !== "register" && <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
          {!ready ? <div className="view-loading" role="status">Preparando tus movimientos...</div> : view === "history"
            ? <History transactions={transactions} onSelect={item => setModal({ kind: "detail", id: item.id })} onExport={exportTransactions} onCreate={create} />
            : <Insights transactions={transactions} onCategory={viewCategory} onCreate={create} />}
        </motion.div>}
      </AnimatePresence>
    </main>
    <footer className="site-footer"><div className="footer-inner">
      <p><strong>Wally</strong><span className="footer-dash">—</span>Un poco de orden, cada día.<Icon name="heart" size={12} /></p>
      <nav aria-label="Enlaces del pie de página">
        <button onClick={() => setModal({ kind: "help" })}>Centro de ayuda</button>
        <button onClick={() => setModal({ kind: "privacy" })}>Privacidad</button>
        <button onClick={() => exportTransactions()}>Exportar CSV<Icon name="download" size={13} /></button>
      </nav>
    </div></footer>

    <AnimatePresence>{modal && <Modal key={modal.kind} title={modalTitle} onClose={closeModal}>
      {modal.kind === "detail" && (selected
        ? <TransactionDetail key={selected.id} transaction={selected} onSave={update} onDelete={() => remove(selected.id)} />
        : <div className="empty-state"><Icon name="info" /><h3>Este movimiento ya no está disponible</h3><p>Puede haberse eliminado desde otra pestaña.</p></div>)}
      {modal.kind === "help" && <HelpPanel />}
      {modal.kind === "privacy" && <PrivacyPanel onExport={() => { setModal(null); exportTransactions(); }} />}
    </Modal>}</AnimatePresence>
  </div>;
}

export function WallyApp({ showLanding = false }: { showLanding?: boolean }) {
  const localSession = useSyncExternalStore(subscribeLocalTestSession, localTestSessionSnapshot, localTestServerSnapshot);
  if (LocalWorkspace && localSession === 2) return <Suspense fallback={<main className="auth-page"><p role="status">Preparando tu prueba local...</p></main>}>
    <LocalWorkspace signOut={async () => { setLocalTestSession(false); toast.dismiss(); }}><WalletScreen /></LocalWorkspace>
  </Suspense>;
  return <AuthBoundary showLanding={showLanding} onLocalSignIn={LocalWorkspace && localSession === 1 ? () => setLocalTestSession(true) : undefined}>{identity =>
    <CloudWorkspace key={identity.user.id} identity={identity}><WalletScreen /></CloudWorkspace>}
  </AuthBoundary>;
}
