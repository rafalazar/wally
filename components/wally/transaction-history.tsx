"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  displayDate, formatMoney, fullDate, monthLabel, paymentMethods, type Transaction,
} from "@/lib/finance";
import { filterTransactions } from "@/lib/insights";
import { Icon } from "./icon";
import { TransactionForm } from "./transaction-form";
import { useCategories, useUi } from "./wally-provider";

export function TransactionRow({ transaction, onClick }: { transaction: Transaction; onClick: () => void }) {
  const categories = useCategories();
  const category = categories.find(item => item.id === transaction.category)!;
  const payment = paymentMethods.find(item => item.id === transaction.paymentMethod)!;
  const income = transaction.type === "income";
  const isCoffee = transaction.category === "food" && /café|cafetería/i.test(transaction.description);
  return <motion.button className="transaction-row" type="button" onClick={onClick}
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    aria-label={`Ver detalle: ${transaction.description}, ${income ? "ingreso" : "gasto"} de ${formatMoney(transaction.amountCents)}`}>
    <span className={`transaction-icon tone-${category.tone}`} aria-hidden="true">{isCoffee ? "☕" : category.emoji}</span>
    <span className="transaction-info"><span className="transaction-title">{transaction.description}</span>
      <span className="transaction-meta"><span>{category.label}</span><i>·</i><span>{displayDate(transaction.date)}</span>
        <i className="payment-meta">·</i><span className="payment-meta">{payment.fullLabel}</span>
      </span>
    </span>
    <span className="transaction-amount">
      <strong className={income ? "income-text" : "expense-text"}>{income ? "+" : "−"}{formatMoney(transaction.amountCents)}</strong>
      <span>{income ? "Ingreso" : "Gasto"}</span>
    </span>
    <Icon name="chevron" size={16} className="row-chevron" />
  </motion.button>;
}

export function EmptyState({ filtered = false, onAction }: { filtered?: boolean; onAction?: () => void }) {
  return <div className="empty-state">
    <span className="empty-icon"><Icon name={filtered ? "search" : "wallet"} size={28} /></span>
    <h3>{filtered ? "No encontramos movimientos" : "Un buen comienzo para tus cuentas"}</h3>
    <p>{filtered ? "Prueba con otro detalle o cambia los filtros." : "Registra tu primer ingreso o gasto. Cada pequeño paso cuenta."}</p>
    {onAction && <button className="text-button" onClick={onAction}>
      {filtered ? "Limpiar filtros" : "Registrar mi primer movimiento"}<Icon name="arrow" size={16} />
    </button>}
  </div>;
}

function HistoryResults({ items, onSelect }: { items: Transaction[]; onSelect: (item: Transaction) => void }) {
  const [limit, setLimit] = useState(30);
  return <>
    <div className="transactions-card">
      {items.slice(0, limit).map(item => <TransactionRow key={item.id} transaction={item} onClick={() => onSelect(item)} />)}
    </div>
    {items.length > limit && <button className="secondary-button load-more" onClick={() => setLimit(limit + 30)}>
      Ver más movimientos <span>{Math.min(limit, items.length)} de {items.length}</span><Icon name="chevronDown" size={16} />
    </button>}
  </>;
}

export function History({ transactions, onSelect, onExport, onCreate }: {
  transactions: Transaction[]; onSelect: (item: Transaction) => void;
  onExport: (items: Transaction[]) => void; onCreate: () => void;
}) {
  const filters = useUi(state => state.filters);
  const categories = useCategories();
  const setFilters = useUi(state => state.setFilters);
  const clearFilters = useUi(state => state.clearFilters);
  const search = useDeferredValue(filters.search);
  const filtered = useMemo(() => filterTransactions(transactions, { ...filters, search }, categories), [transactions, filters, search, categories]);
  const months = [...new Set(transactions.map(item => item.date.slice(0, 7)))].sort().reverse();
  const isFiltered = !!(filters.search || filters.month || filters.type !== "all" || filters.category !== "all");
  const totals = filtered.reduce((sum, item) => ({ ...sum, [item.type]: sum[item.type] + item.amountCents }), { income: 0, expense: 0 });

  return <section className="history-page page-section" aria-labelledby="history-title">
    <div className="page-heading">
      <div className="section-heading"><span className="section-kicker">CADA MOVIMIENTO CUENTA</span>
        <h1 id="history-title">Tu dinero, en detalle.</h1><p>Encuentra, revisa y edita tus movimientos.</p>
      </div>
      <button className="primary-button" onClick={onCreate}><Icon name="plus" size={18} />Nuevo movimiento</button>
    </div>
    <div className="history-toolbar">
      <div className="history-search input-with-icon"><Icon name="search" size={18} />
        <input aria-label="Buscar movimientos" placeholder="Buscar por detalle o categoría..." value={filters.search}
          onChange={event => setFilters({ search: event.target.value })} />
        {filters.search && <button className="icon-button" aria-label="Borrar búsqueda" onClick={() => setFilters({ search: "" })}><Icon name="close" size={16} /></button>}
      </div>
      <div className="history-filters">
        <div className="filter-tabs" aria-label="Filtrar por tipo">
          {(["all", "expense", "income"] as const).map(value => <button key={value} type="button"
            aria-pressed={filters.type === value} className={filters.type === value ? "selected" : ""}
            onClick={() => setFilters({ type: value, category: "all" })}>{value === "all" ? "Todos" : value === "expense" ? "Gastos" : "Ingresos"}</button>)}
        </div>
        <div className="filter-selects">
          <select aria-label="Filtrar por categoría" value={filters.category}
            onChange={event => setFilters({ category: event.target.value as typeof filters.category })}>
            <option value="all">Todas las categorías</option>
            {categories.filter(c => filters.type === "all" || c.type === filters.type).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select aria-label="Filtrar por mes" value={filters.month} onChange={event => setFilters({ month: event.target.value })}>
            <option value="">Cualquier mes</option>
            {months.map(month => <option key={month} value={month}>{monthLabel(month, true)}</option>)}
          </select>
          <select aria-label="Ordenar movimientos" value={filters.sort}
            onChange={event => setFilters({ sort: event.target.value as typeof filters.sort })}>
            <option value="date">Más recientes</option><option value="amount">Mayor monto</option>
          </select>
        </div>
      </div>
    </div>
    <div className="history-count">
      <span><strong>{filtered.length}</strong> {filtered.length === 1 ? "movimiento" : "movimientos"}
        {isFiltered && <button className="clear-filters" onClick={clearFilters}>Limpiar filtros <Icon name="close" size={13} /></button>}
      </span>
      <button className="text-button" onClick={() => onExport(filtered)} disabled={!filtered.length}>
        <Icon name="download" size={16} />Exportar CSV
      </button>
    </div>
    {filtered.length > 0 ? <>
      <HistoryResults key={JSON.stringify(filters)} items={filtered} onSelect={onSelect} />
      <div className="history-totals"><span>Total de esta selección</span>
        <span>Ingresos <strong className="income-text">+{formatMoney(totals.income)}</strong></span>
        <span>Gastos <strong className="expense-text">−{formatMoney(totals.expense)}</strong></span>
      </div>
    </> : <div className="transactions-card"><EmptyState filtered={isFiltered}
      onAction={isFiltered ? clearFilters : onCreate} /></div>}
  </section>;
}

export function TransactionDetail({ transaction, onDelete, onSave }: {
  transaction: Transaction; onDelete: () => Promise<void>; onSave: (item: Transaction) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const categories = useCategories();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const category = categories.find(item => item.id === transaction.category)!;
  const payment = paymentMethods.find(item => item.id === transaction.paymentMethod)!;
  const income = transaction.type === "income";
  async function remove() {
    setBusy(true);
    setError("");
    try { await onDelete(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos eliminar el movimiento."); }
    finally { setBusy(false); }
  }
  if (editing) return <TransactionForm ready initial={transaction} onSave={onSave} onCancel={() => setEditing(false)} />;
  return <>
    <div className="detail-summary">
      <span className={`transaction-icon tone-${category.tone}`}>{category.emoji}</span>
      <h3>{transaction.description}</h3>
      <p className={income ? "income-text" : "expense-text"}>{income ? "+" : "−"}{formatMoney(transaction.amountCents)}</p>
    </div>
    <dl className="detail-facts">
      <div><dt>Tipo</dt><dd>{income ? "Ingreso" : "Gasto"}</dd></div>
      <div><dt>Categoría</dt><dd>{category.label}</dd></div>
      <div><dt>Método</dt><dd>{payment.fullLabel}</dd></div>
      <div><dt>Fecha</dt><dd>{fullDate(transaction.date)}</dd></div>
      <div><dt>Moneda</dt><dd>Soles (PEN)</dd></div>
      {transaction.isDemo && <div><dt>Origen</dt><dd>Datos de ejemplo</dd></div>}
    </dl>
    {error && <div className="inline-error" role="alert"><Icon name="info" size={18} />{error}</div>}
    {confirming ? <div className="delete-confirm">
      <p>¿Eliminar este movimiento? El saldo se actualizará.</p>
      <div className="dialog-actions">
        <button className="secondary-button" disabled={busy} onClick={() => setConfirming(false)}>Conservar</button>
        <button className="danger-button" disabled={busy} onClick={remove}>
          {busy && <Icon name="loader" className="spin" size={16} />}{busy ? "Eliminando..." : "Sí, eliminar"}
        </button>
      </div>
    </div> : <div className="detail-actions">
      <button className="secondary-button" onClick={() => setEditing(true)}><Icon name="edit" size={17} />Editar movimiento</button>
      <button className="delete-button" onClick={() => setConfirming(true)}><Icon name="trash" size={16} />Eliminar</button>
    </div>}
  </>;
}

