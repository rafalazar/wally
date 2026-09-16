"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, localDate, monthLabel, type CategoryId, type Transaction } from "@/lib/finance";
import { availableMonths, buildMonthlyInsights } from "@/lib/insights";
import { Icon } from "./icon";
import { useCategories, useUi } from "./wally-provider";

export default function Insights({ transactions, onCategory, onCreate }: {
  transactions: Transaction[];
  onCategory: (category: CategoryId, month: string) => void;
  onCreate: () => void;
}) {
  const month = useUi(state => state.month);
  const categories = useCategories();
  const setMonth = useUi(state => state.setMonth);
  const reduced = useReducedMotion();
  const data = useMemo(() => buildMonthlyInsights(transactions, month, localDate(), categories), [transactions, month, categories]);
  const months = availableMonths(transactions);
  const leading = data.breakdown[0];

  return <section className="insights-page page-section" aria-labelledby="insights-title">
    <div className="page-heading">
      <div className="section-heading"><span className="section-kicker">DALE PERSPECTIVA A TUS CUENTAS</span>
        <h1 id="insights-title">Entiende tu mes.</h1><p>Una mirada sencilla a lo que entra y lo que sale.</p>
      </div>
      <label className="month-picker"><Icon name="calendar" size={18} /><span className="sr-only">Mes del resumen</span>
        <select value={month} onChange={event => setMonth(event.target.value)}>
          {months.map(value => <option key={value} value={value}>{monthLabel(value)}</option>)}
        </select>
      </label>
    </div>

    <div className="insight-metrics">
      <article><span className="insight-metric-label"><Icon name="up" size={17} />Ingresos del período</span><strong className="income-text">{formatMoney(data.income)}</strong></article>
      <article><span className="insight-metric-label"><Icon name="down" size={17} />Gastos del período</span><strong className="expense-text">{formatMoney(data.expense)}</strong></article>
      <article><span className="insight-metric-label"><Icon name="wallet" size={17} />Balance del período</span><strong>{formatMoney(data.balance)}</strong></article>
    </div>

    {data.items.length ? <div className="insights-grid">
      <article className="chart-card activity-chart">
        <div className="chart-heading"><div><h2>El ritmo de tu dinero</h2><p>Ingresos y gastos por día · PEN</p></div>
          <div className="chart-legend"><span><i className="legend-income" />Ingresos</span><span><i className="legend-expense" />Gastos</span></div>
        </div>
        <div className="bar-chart" aria-label={`Ingresos y gastos diarios de ${monthLabel(month)}`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data.daily} accessibilityLayer margin={{ top: 14, right: 4, left: -12, bottom: 0 }} barGap={2}>
              <CartesianGrid stroke="#eeeae5" vertical={false} strokeDasharray="3 4" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#748095", fontSize: 11 }} minTickGap={12} dy={8} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#748095", fontSize: 11 }}
                tickFormatter={value => new Intl.NumberFormat("es-PE", { notation: "compact", style: "currency", currency: "PEN", maximumFractionDigits: 1 }).format(Number(value) / 100)} />
              <Tooltip cursor={{ fill: "#f4f2ef", radius: 4 }} formatter={value => formatMoney(Number(value))}
                labelFormatter={label => `Día ${label}`} contentStyle={{ borderRadius: 14, border: "1px solid #eae6e0", fontSize: 12 }}
                itemStyle={{ padding: "3px 0" }} />
              <Bar name="Ingresos" dataKey="income" fill="#39b994" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={!reduced} animationDuration={550} />
              <Bar name="Gastos" dataKey="expense" fill="#ff856c" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={!reduced} animationDuration={550} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="chart-note">{data.items.length} movimientos registrados en {monthLabel(month)}.</p>
      </article>

      <article className="chart-card category-chart">
        <div className="chart-heading"><div><h2>¿En qué estás gastando?</h2><p>Tu distribución por categoría</p></div><Icon name="chart" size={20} /></div>
        {data.expense ? <>
          <div className="donut-wrap">
            <div className="donut-chart" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={data.breakdown} dataKey="amount" nameKey="label" innerRadius="72%" outerRadius="94%"
                    paddingAngle={data.breakdown.length > 1 ? 4 : 0} cornerRadius={5} stroke="none"
                    isAnimationActive={!reduced} animationDuration={550}>
                    {data.breakdown.map(item => <Cell key={item.id} fill={item.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-label"><span>Total de gastos</span><strong>{formatMoney(data.expense)}</strong></div>
          </div>
          <div className="category-breakdown">
            {data.breakdown.map(item => <button key={item.id} onClick={() => onCategory(item.id, month)}
              aria-label={`Ver gastos en ${item.label}, ${formatMoney(item.amount)}`}>
              <span className="category-color" style={{ backgroundColor: item.color }} /><span className="breakdown-name">{item.label}</span>
              <span className="breakdown-percent">{Math.round(item.amount / data.expense * 100)}%</span>
              <strong>{formatMoney(item.amount)}</strong><Icon name="chevron" size={13} />
            </button>)}
          </div>
        </> : <div className="chart-empty"><span className="empty-icon"><Icon name="sparkle" size={28} /></span><h3>Aún no hay gastos este mes</h3><p>Las categorías aparecerán con tu primer gasto.</p></div>}
      </article>

      <aside className="monthly-note"><span className="mini-icon"><Icon name="sparkle" size={21} /></span>
        <div><h3>{leading ? "Un detalle que suma claridad" : "Cada registro te ayuda a ver más"}</h3>
          <p>{leading ? <><strong>{leading.label}</strong> representa el <strong>{Math.round(leading.amount / data.expense * 100)}%</strong> de tus gastos de este mes. Toca una categoría para revisar sus movimientos.</> : "Sigue registrando tus movimientos para conocer mejor tus hábitos."}</p>
        </div>
      </aside>
    </div> : <div className="chart-card insights-empty"><span className="empty-icon"><Icon name="chart" size={32} /></span>
      <h2>Este mes tiene una página en blanco</h2><p>No hay movimientos en {monthLabel(month)}. Elige otro mes o empieza con tu primer registro.</p>
      <button className="primary-button" onClick={onCreate}><Icon name="plus" size={18} />Registrar movimiento</button>
    </div>}
    <p className="insights-footnote">El balance del período es la diferencia entre los ingresos y gastos del mes seleccionado.</p>
  </section>;
}
