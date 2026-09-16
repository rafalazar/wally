"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { formatMoney, type summarize } from "@/lib/finance";
import { Icon, type IconName } from "./icon";

function AnimatedMoney({ cents, prefix = "", ready }: { cents: number; prefix?: string; ready: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(cents);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!ready || !ref.current) return;
    const node = ref.current;
    const animation = animate(previous.current, cents, {
      duration: reduced ? 0 : 0.55,
      ease: "easeOut",
      onUpdate(value) { previous.current = Math.round(value); node.textContent = prefix + formatMoney(previous.current); },
    });
    return () => animation.stop();
  }, [cents, prefix, ready, reduced]);
  return <span ref={ref} aria-label={ready ? prefix + formatMoney(cents) : "Cargando saldo"}>
    {ready ? prefix + formatMoney(cents) : "—"}
  </span>;
}

function MetricCard({ title, cents, prefix, detail, tone, icon, ready }: {
  title: string; cents: number; prefix?: string; detail: string;
  tone: string; icon: IconName; ready: boolean;
}) {
  return <article className={`metric-card metric-${tone}`}>
    <div className="metric-content"><h2>{title}</h2>
      <p className="metric-value"><AnimatedMoney cents={cents} prefix={prefix} ready={ready} /></p>
      <p className="metric-detail">{tone === "balance" && <Icon name="trend" size={14} />}{detail}</p>
    </div>
    <span className="metric-icon"><Icon name={icon} size={23} /></span>
  </article>;
}

export function Metrics({ totals, ready }: { totals: ReturnType<typeof summarize>; ready: boolean }) {
  return <section className="metrics" aria-label="Resumen de tus finanzas" aria-busy={!ready}>
    <MetricCard title="Saldo disponible" cents={totals.balance} detail="Tus ingresos menos tus gastos" tone="balance" icon="card" ready={ready} />
    <MetricCard title="Ingresos de este mes" cents={totals.income} prefix="+"
      detail={`${totals.incomeCount} ${totals.incomeCount === 1 ? "ingreso recibido" : "ingresos recibidos"}`} tone="income" icon="up" ready={ready} />
    <MetricCard title="Gastos de este mes" cents={totals.expense} prefix="−"
      detail={`${totals.expenseCount} ${totals.expenseCount === 1 ? "gasto registrado" : "gastos registrados"}`} tone="expense" icon="down" ready={ready} />
  </section>;
}
