import { format, isValid, parseISO, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";

export const categories = [
  { id: "food", label: "Alimentación", emoji: "🍔", type: "expense", tone: "orange", color: "#ff7658" },
  { id: "transport", label: "Transporte", emoji: "🚕", type: "expense", tone: "yellow", color: "#f2bd60" },
  { id: "shopping", label: "Compras", emoji: "🛒", type: "expense", tone: "blue", color: "#89a9e6" },
  { id: "services", label: "Servicios", emoji: "💡", type: "expense", tone: "yellow", color: "#a597ce" },
  { id: "entertainment", label: "Entretenimiento", emoji: "🎬", type: "expense", tone: "purple", color: "#e8a0b1" },
  { id: "health", label: "Salud", emoji: "💊", type: "expense", tone: "pink", color: "#79bea8" },
  { id: "salary", label: "Sueldo", emoji: "💰", type: "income", tone: "green", color: "#27ac86" },
  { id: "freelance", label: "Honorarios", emoji: "💼", type: "income", tone: "green", color: "#80c5af" },
  { id: "sales", label: "Ventas", emoji: "🛍️", type: "income", tone: "blue", color: "#89a9e6" },
  { id: "investments", label: "Inversiones", emoji: "🌱", type: "income", tone: "green", color: "#7fb392" },
  { id: "gifts", label: "Regalos", emoji: "🎁", type: "income", tone: "purple", color: "#a597ce" },
  { id: "other", label: "Otros ingresos", emoji: "✨", type: "income", tone: "yellow", color: "#f2bd60" },
] as const;

export const paymentMethods = [
  { id: "debit", label: "Débito", fullLabel: "Tarjeta de débito", emoji: "💳" },
  { id: "credit", label: "Crédito", fullLabel: "Tarjeta de crédito", emoji: "💳" },
  { id: "cash", label: "Efectivo", fullLabel: "Efectivo", emoji: "💵" },
  { id: "transfer", label: "Transferencia", fullLabel: "Transferencia", emoji: "🏦" },
] as const;

export type TransactionType = "expense" | "income";
export type CategoryId = string;
export type PaymentMethod = (typeof paymentMethods)[number]["id"];
export const MAX_AMOUNT_CENTS = 99_999_999_999;

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency", currency: "PEN",
});

export function localDate(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseISO(value);
  return isValid(date) && localDate(date) === value;
}

/** Keep monetary arithmetic in integer cents, never floating-point currency. */
export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,9}(?:\.\d{0,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents > 0 && cents <= MAX_AMOUNT_CENTS ? cents : null;
}

export function formatMoney(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function displayDate(value: string, today = localDate()): string {
  if (value === today) return "Hoy";
  if (value === localDate(subDays(parseISO(today), 1))) return "Ayer";
  return format(parseISO(value), value.slice(0, 4) === today.slice(0, 4) ? "d MMM" : "d MMM yyyy", { locale: es });
}

export function monthLabel(month: string, compact = false): string {
  return format(parseISO(`${month}-01`), compact ? "MMM yyyy" : "MMMM yyyy", { locale: es });
}

export function fullDate(value: string): string {
  return format(parseISO(value), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export const categorySchema = z.string().min(1).max(80);
export const categoryDefinitionSchema = z.object({
  id: categorySchema,
  label: z.string().trim().min(1).max(40),
  emoji: z.string().min(1).max(16),
  type: z.enum(["expense", "income"]),
  tone: z.enum(["orange", "yellow", "blue", "purple", "pink", "green"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type Category = z.infer<typeof categoryDefinitionSchema>;
export const paymentSchema = z.enum(paymentMethods.map(item => item.id));
const typeSchema = z.enum(["expense", "income"]);
const dateSchema = z.string().refine(isValidDate, "Elige una fecha válida.");
const descriptionSchema = z.string().trim().min(1, "Añade un detalle para recordar este movimiento.").max(160, "Usa hasta 160 caracteres.");

export const transactionSchema = z.object({
  id: z.string().min(1),
  type: typeSchema,
  amountCents: z.number().int().positive().max(MAX_AMOUNT_CENTS),
  description: descriptionSchema,
  category: categorySchema,
  paymentMethod: paymentSchema,
  date: dateSchema,
  createdAt: z.string().refine(value => Number.isFinite(Date.parse(value))),
  version: z.number().int().positive().optional(),
}).refine(item => !categories.some(c => c.id === item.category && c.type !== item.type), {
  message: "Elige una categoría para este tipo de movimiento.", path: ["category"],
});

export const walletSchema = z.object({
  version: z.literal(1),
  transactions: z.array(transactionSchema),
  currency: z.literal("PEN").default("PEN"),
  categories: z.array(categoryDefinitionSchema).default(() => categories.map(c => ({ ...c }))),
}).refine(data => new Set(data.transactions.map(item => item.id)).size === data.transactions.length, {
  message: "Hay identificadores de movimiento repetidos.",
}).superRefine((data, context) => {
  if (new Set(data.categories.map(c => c.id)).size !== data.categories.length ||
      new Set(data.categories.map(c => `${c.type}:${c.label.toLocaleLowerCase()}`)).size !== data.categories.length) {
    context.addIssue({ code: "custom", message: "Esta categoría ya existe en la billetera." });
  }
  for (const item of data.transactions) {
    if (!data.categories.some(c => c.id === item.category && c.type === item.type)) {
      context.addIssue({ code: "custom", message: "El movimiento tiene una categoría incompatible." });
    }
  }
});

export const createTransactionFormSchema = (catalog: readonly Category[] = categories) => z.object({
  type: typeSchema,
  amount: z.string().refine(value => parseAmount(value) !== null, "Ingresa un monto mayor a 0, con hasta 2 decimales."),
  description: descriptionSchema,
  category: categorySchema,
  paymentMethod: paymentSchema,
  date: dateSchema.refine(value => value >= "1900-01-01" && value <= localDate(), "La fecha debe ser hasta el día de hoy."),
}).superRefine((values, context) => {
  if (!catalog.some(item => item.id === values.category && item.type === values.type)) {
    context.addIssue({ code: "custom", path: ["category"], message: "Selecciona una categoría válida." });
  }
  if (values.type === "income" && !["cash", "transfer"].includes(values.paymentMethod)) {
    context.addIssue({ code: "custom", path: ["paymentMethod"], message: "Elige efectivo o transferencia para este ingreso." });
  }
});
export const transactionFormSchema = createTransactionFormSchema();

export type Transaction = z.infer<typeof transactionSchema>;
export type WalletData = z.infer<typeof walletSchema>;
export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function summarize(transactions: Transaction[], today = localDate()) {
  let balance = 0, income = 0, expense = 0, incomeCount = 0, expenseCount = 0;
  for (const item of transactions) {
    if (item.date > today) continue;
    balance += item.type === "income" ? item.amountCents : -item.amountCents;
    if (!item.date.startsWith(today.slice(0, 7))) continue;
    if (item.type === "income") { income += item.amountCents; incomeCount++; }
    else { expense += item.amountCents; expenseCount++; }
  }
  return { balance, income, expense, incomeCount, expenseCount };
}

export function recentFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

function csvCell(value: string): string {
  const safe = /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function transactionsToCsv(transactions: Transaction[], catalog: readonly Category[] = categories): string {
  const rows = transactions.map(item => [
    item.date, item.type === "income" ? "Ingreso" : "Gasto", item.description,
    catalog.find(c => c.id === item.category)?.label ?? item.category,
    paymentMethods.find(m => m.id === item.paymentMethod)!.fullLabel,
    (item.amountCents / 100).toFixed(2), "PEN",
  ]);
  const headers = ["Fecha", "Tipo", "Detalle", "Categoría", "Método", "Monto", "Moneda"];
  return "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
}

